/* =====================================================================
   The Help Desk chats, from two Core-2-Sims files:
     Help Desk - Email.html    (Help Desk Chat: Email Issue)
     Help Desk - Router.html   (Help Desk Chat: Router Setup)
   Each sim word for word as its first ticket (CE1, CR1), and five more.

   The owner's rulings (1 and 4 October 2026):
     - six replies shown on each step, from a pool of nine: one right,
       eight wrong. The wrong ones are the sim's own, jokes kept ("Blow on
       the SIM card"), plus the mistakes technicians really make
     - chat plus hands-on: the student also checks the real thing, the
       customer's phone in Mobile devices or their router in the 92 Series
       app, before answering and after the customer has changed something
     - a mood line: a wrong reply upsets the customer, in words
   The sims' keys stand: they are exam prep (the owner, 30 September).

   A wrong reply that is an instruction ("change the port to 143") is
   tried by the customer, fails, and is put back, so a wrong answer never
   carries forward and poisons the steps after it.
   ===================================================================== */
import * as CH from "./chat.js";
import * as MB from "./mobile.js";
import * as R from "./router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
function ok(label) { return { label: label, correct: true, why: "" }; }
function no(label, reaction, why) { return { label: label, correct: false, reaction: reaction, why: why }; }
function copy(x) { return JSON.parse(JSON.stringify(x)); }

/* a professional close, for the five-more chats (the sims end on the
   customer's thanks) */
function closing(thanks) { return { type: "reply", cust: [thanks], h: ["The job's done and the customer is happy. How does a professional end a support chat?", "Close politely, make sure nothing else is needed, and never leave the customer feeling foolish."],
  right: ok("Glad it's working! Is there anything else I can help you with today?"), wrong: [
    no("Bye.", "Oh. OK, bye then.", "Abrupt. Close politely and check nothing else is needed."),
    no("Glad it's working! Next time, please check your settings yourself before contacting us.", "I didn't know there were settings to check...", "Lecturing the customer sours a good fix. Thank them and offer more help."),
    no("Told you it was simple.", "Well, it wasn't simple for me.", "That makes the customer feel foolish. Never do it."),
    no("Closing the chat now.", "Wait, I had one more question...", "Ask whether there's anything else before you close."),
    no("Please rate me five stars!", "Er... OK?", "Asking for ratings isn't how you close a support chat."),
    no("No problem. These things happen to people who don't read the manual.", "Excuse me?", "A dig at the customer, however light, is unprofessional."),
    no("Glad it's working! I'll mark this resolved now. Do call us again when it breaks.", "That sounds like you expect it to break...", "Close on a positive note, and check if anything else is needed."),
    no("You're welcome, glad it's working! It was your device's fault anyway, not our system.", "My device's fault? Should I get a new one?", "Blaming the device worries them for nothing: it was a setting.")] }; }

/* --------------------------------------------------------- the factory */
function chatTicket(o) {
  const t = Object.assign({ tier: 1, kind: "chat", outcome: "resolve", machine: "TECH" }, o);
  t.who = o.from.split(" ")[0];
  t.setup = function (fleet) {
    if (o.phone) MB.add(fleet, Object.assign({ id: t.id }, o.phone));
    if (o.router) { const r = R.add(fleet, Object.assign({ id: t.id }, o.router)); if (o.prepare) o.prepare(r, fleet); }
    CH.start(fleet, t.id, o.mood || 0, { phone: o.phone ? MB.get(fleet, t.id) : null, router: o.router ? R.get(fleet, t.id) : null });
    fleet.TECH.clock = o.clock || "Oct 06 10:30";
  };
  /* starting the chat again puts the customer's phone or router back */
  t.restore = function (fleet) {
    const c = CH.get(fleet, t.id); if (!c || !c.keep) return;
    if (c.keep.phone) MB.all(fleet)[t.id] = copy(c.keep.phone);
    if (c.keep.router) R.all(fleet)[t.id] = copy(c.keep.router);
  };
  t.goal = function (fleet) { return CH.finished(fleet, t); };
  /* a hands-on step ticks off the moment it's really done */
  t.react = function (act, fleet) { CH.advance(fleet, t); };
  t.scoreFn = function (fleet) { const c = CH.get(fleet, t.id); return c ? c.step : 0; };
  t.judge = function (act, fleet) {
    if (act.type === "chat-reply") return act.correct ? { guess: false } : { guess: true, say: act.why };
    if (act.type === "router-factory") return { guess: true, say: "That wiped " + t.who + "'s router back to its defaults, the sticker's passwords and all. Start the chat again to put it back." };
    if (act.type === "router-reboot" && act.lost) return { guess: true, say: "The router restarted and threw away what was typed but not saved." };
    return { guess: false };
  };
  t.hints = function (fleet) {
    const it = CH.current(fleet, t);
    if (!it) return ["The chat is done. Resolve the ticket.", "Last, record why it worked, and write the note."];
    return it.h;
  };
  /* rung 3's six: the replies on screen, or the step's six moves */
  t.moves = function (fleet) {
    const it = CH.current(fleet, t), c = CH.get(fleet, t.id);
    if (!it) return [opt("Resolve the ticket, record the cause, write the note", true), opt("Start the chat again", false, "It's finished: the customer confirmed it works."), opt("Escalate to Tier 2", false, "Nothing is left to escalate."), opt("Ask the customer to test again", false, "They already have."), opt("Close the chat window and leave the ticket open", false, "An open ticket for finished work misleads the team."), opt("Email the customer a survey", false, "Not before the ticket is closed and noted.")];
    if (it.type === "reply") return CH.shown(t, c, c.step).map(function (x) { return opt(x.label, x.correct, x.why); });
    return it.moves;
  };
  /* rung 3 strikes four of the six replies on screen, a reason each */
  t.strikeNow = function (fleet, survivor) {
    const it = CH.current(fleet, t), c = CH.get(fleet, t.id); if (!it || it.type !== "reply") return null;
    const opts = CH.shown(t, c, c.step), picked = {}; (c.out[c.step] || []).forEach(function (l) { picked[l] = true; });
    const keep = survivor(opts, picked), out = {};
    opts.forEach(function (x) { if (!x.correct && x.label !== keep) out[x.label] = x.why; });
    return { id: "chat", which: c.step, strike: out };
  };
  t.notReady = function (fleet) {
    const it = CH.current(fleet, t); if (!it) return null;
    return it.type === "do" ? t.who + " is still in the chat, waiting while you check: " + it.doing : t.who + " is still in the chat, waiting for your reply.";
  };
  return t;
}

/* ------------------------------------------------- the email chats' pieces */
function phoneOf(fleet, t) { return MB.get(fleet, t.id); }
/* the hands-on checks: compare the phone with the server; then, after the
   customer's change, sync the phone yourself and read the result */
function compare(who, cust) { return { type: "do", act: "compare", cust: cust, doing: "Compare " + who + "'s mail settings with what the company mail server accepts: open Mobile devices, read " + who + "'s phone, then the mail server.",
  done: function (fleet, t) { const p = phoneOf(fleet, t); return !!p && MB.seen(p, "view-phone") > 0 && MB.seen(p, "view-server") > 0; },
  after: "You compared " + who + "'s settings with the mail server's, in Mobile devices.",
  h: [who + "'s screenshot is one side. Mobile devices shows both: " + who + "'s phone, and the company mail server.", "A mail app has to match the server exactly: the server's name, the protocol, the port, and the encryption the server uses on that port."],
  moves: [opt("Open Mobile devices: read " + who + "'s phone, then the mail server", true), opt("Reply straight away with your best guess", false, "Check before you advise: a wrong guess has them changing settings for nothing."), opt("Ask " + who + " to restart the phone again", false, "Restarting doesn't change a setting."), opt("Escalate to the mail team", false, "It's a phone setting, Tier 1's job."), opt("Wipe the phone remotely and start again", false, "Destroys everything on it for a setting."), opt("Ask " + who + " for the password to test it yourself", false, "Never ask for a password.")] }; }
function confirmSync(who, cust, after, check) { return { type: "do", act: "sync", cust: cust, doing: "Confirm it from your side: in Mobile devices, press Sync now on " + who + "'s phone and read the result.",
  done: function (fleet, t) { const p = phoneOf(fleet, t); return !!p && MB.lastAt(p, "student-sync") > MB.lastAt(p, "set") && MB.works(p) && (!check || check(p)); },
  after: after,
  h: ["Don't take the fix on trust: the phone itself will tell you whether it worked.", "After any change, test it yourself before you tell the customer it's fixed."],
  moves: [opt("Press Sync now on " + who + "'s phone in Mobile devices and read the result", true), opt("Tell " + who + " it's fixed", false, "You haven't checked: if it still fails, they find out first."), opt("Close the chat", false, "Not before you've confirmed it."), opt("Ask " + who + " to forward you an email to prove it", false, "Slower and less certain than looking yourself."), opt("Restart the mail server", false, "The server is fine, and that would cut everyone off."), opt("Escalate to Tier 2 to confirm", false, "You can confirm it yourself.")] }; }
/* the customer makes the change you asked for, and the phone checks mail */
function change(sets) { return function (fleet, t) { const p = phoneOf(fleet, t); Object.keys(sets).forEach(function (k) { MB.set(p, k, sets[k]); }); MB.sync(p); }; }
const SERVER_OK = { server: "mail.rafiki.local", port: 587, sec: "STARTTLS", auth: true };

/* ---------------------------------------------------------- the email chats */
const CE = [
  /* CE1: the sim itself, word for word */
  chatTicket({ id: "CE1", base: true, sim: "Help Desk Chat: Email Issue", title: "Email is down on Brenda's phone",
    from: "Brenda Smith, Sales", site: "Rafiki's IT Services, Office 2", channel: "email",
    brief: ["Brenda Smith has started a chat with the help desk about her email.", "Her company phone is enrolled in Mobile devices, so you can see it from your laptop."],
    phone: { owner: "Brenda Smith", model: "TechCom T7", account: { email: "bsmith@rafiki.local", proto: "IMAP", sec: "SSL/TLS", server: "10.0.8.1", port: 100, out: copy(SERVER_OK), pass: "current" } },
    chat: [
      { type: "reply", cust: ["Email is currently down!"], h: ["A customer has just arrived in the chat. Before any fixing: what does every good support conversation open with?", "Open politely and offer help. Don't guess at a cause, don't brush them off, and never ask for a password."],
        right: ok("Good afternoon, I will be happy to assist you with your email."), wrong: [
        no("Try restarting your phone.", "Restart it? I've done that twice already. It's still not getting email.", "That jumps to a fix before you know what's wrong. Greet her and find out first."),
        no("Are you sure it's not your internet?", "Yes, I'm sure. Everything else on my phone works fine.", "It brushes her off and blames her. Open professionally, then ask."),
        no("Email is down for everyone today. We're aware and working on it.", "Really? Everyone in the office says theirs is fine...", "You don't know that: nothing says there's an outage. Never guess at a cause in your first reply."),
        no("What's your email password? I'll sign in and check for you.", "My password? Aren't we told never to give that out?", "Never ask for a password. A technician never needs it."),
        no("Please raise a ticket through the portal and someone will get back to you.", "I'm talking to the help desk right now! Why can't you help?", "She's already reached the help desk. Sending her away is how customers get angry."),
        no("OK.", "OK... is anyone going to help me?", "A one-word answer says you don't care. Acknowledge her and offer help."),
        no("Have you tried turning it off and on again?", "Seriously? That's the first thing everyone says.", "A cliché, and a fix before a single question."),
        no("That's not a help desk problem. Email belongs to the mail team.", "Then who do I talk to? I just need my email.", "Email on a company phone is exactly the help desk's job. Don't pass it on.")] },
      { type: "reply", cust: ["This needs to be fixed ASAP as I am unable to access urgent emails through my phone."], h: ["It's only on her phone. What do you need to know about it before you can help?", "Gather facts before you fix: what device it is tells you what to look at."],
        right: ok("I will be glad to help, but first I need to know what type of device you are using."), wrong: [
        no("Check if your inbox is full.", "It's not full, I cleared it out last week.", "A full mailbox doesn't stop you reading mail, and it's only her phone. Ask about the device."),
        no("Did you charge your phone?", "It's at 80 percent. That's not it.", "A phone that's chatting with you is charged. That's a brush-off."),
        no("I'm sorry about that. Use webmail on your laptop for now, because phones aren't supported.", "Phones aren't supported? You gave me this phone!", "Company phones are supported, and a workaround isn't a fix."),
        no("I understand it's urgent, so I'll escalate this straight to Tier 2 for you right away.", "Escalate? Can't you just look at it?", "You haven't asked a single question yet. Gather the facts first."),
        no("Factory reset the phone and set it up again.", "Wipe my phone? I'll lose everything on it!", "Wiping a phone over a mail setting is wildly out of proportion."),
        no("Is it urgent for you, or for the company?", "Does it matter? I can't read my email!", "Questioning her urgency puts her on the defensive."),
        no("Can you send me a screenshot of your inbox?", "It's empty, that's the problem. What would a screenshot of nothing show you?", "An empty inbox shows nothing. Find out what device it is first."),
        no("I understand, but everyone's email is urgent today, so please be patient while we work through the queue.", "Wow. OK.", "Dismissing her urgency is unprofessional and makes her more upset.")] },
      { type: "reply", cust: ["I recently received a phone from TechCom."], h: ["A new phone, and only the phone fails. Where would you look next?", "When one device fails and others work, look at how that device is set up before anything drastic."],
        right: ok("Let's take a look at your phone settings."), wrong: [
        no("Try toggling airplane mode.", "Done that. Nothing.", "Toggling things blindly isn't troubleshooting. Look at how the mail account is set up."),
        no("Blow on the SIM card.", "...Blow on it? Is that a joke?", "It's a joke reply, and the SIM has nothing to do with email."),
        no("TechCom phones don't work with our email.", "Then why did IT give me one?", "Not true: any phone can use company mail with the right settings."),
        no("Send it back to TechCom for a replacement.", "Send it back? It's brand new and everything else works.", "Nothing points to faulty hardware. Look at its settings first."),
        no("Delete the email account and add it again.", "Delete it? What if I lose my emails?", "Re-adding it copies the same wrong settings back. Find out what's wrong first."),
        no("Install a different email app from the store.", "Is that allowed on a company phone?", "Another app with the same settings fails the same way."),
        no("Turn off the phone's antivirus. It's blocking email.", "Turn off security on a company phone? That sounds wrong.", "Never switch protection off to test, and nothing suggests it's involved."),
        no("Did you get it from TechCom's website or from a store?", "Does that matter? It's the company's phone.", "Where it came from doesn't change how it's set up.")] },
      compare("Brenda", ["I updated my phone last night to the latest update, here is a screenshot of my settings.", { attach: { title: "Incoming Server", rows: [["Protocol", "IMAP"], ["Security", "SSL"], ["Server Address", "10.0.8.1"], ["Port", "100"]] } }]),
      { type: "reply", h: ["Line her screenshot up against the mail server in Mobile devices. Which one setting doesn't match?", "IMAP over SSL/TLS has a port of its own. Every other port either isn't a mail service or isn't encrypted."],
        right: ok("Please change the port number on your mail settings to 993."), then: change({ port: 993 }), wrong: [
        no("Switch to POP3 protocol.", "I switched it to POP3... it still says it can't connect. I've put it back to IMAP.", "POP3 doesn't fix a wrong port, and it would pull her mail off the server. IMAP is right: the port isn't."),
        no("Use port 80 instead.", "Port 80... no, same error. I've put it back.", "Port 80 is for web pages. No mail service listens there."),
        no("Please change the port number on your mail settings to 143 instead.", "Changed it to 143. Now it says the server closed the connection. Putting it back.", "143 is IMAP without encryption. This server only takes encrypted connections."),
        no("Please change the port number on your mail settings to 995.", "995... it still won't connect. I've put it back.", "995 is POP3 over SSL. She's set up for IMAP."),
        no("Please change the port number to 587.", "587 doesn't work either. I've put it back.", "587 is for sending mail (SMTP), not receiving."),
        no("Please turn SSL off in your mail settings and leave the port as it is.", "Turned SSL off: still can't connect. I've turned it back on.", "Nothing listens on port 100 at all, and switching encryption off is never the answer."),
        no("Change the server address to mail.google.com.", "That's not our email! I've put it back.", "Her mail is on the company server. The address is right; the port is wrong."),
        no("Uninstall last night's update.", "I can't even find how to do that. Is that really it?", "The update didn't change her port. Rolling back loses security fixes and fixes nothing.")] },
      confirmSync("Brenda", ["OK, I've changed the port to 993."], "Mobile devices: Brenda's phone synced over IMAP on 993 (SSL/TLS).")
    ],
    end: ["Great, it works now! Thanks for helping!"],
    close: { prompt: "Why did port 993 fix it?", options: [
      opt("Her phone uses IMAP with SSL; the server takes encrypted IMAP on 993, and nothing listens on port 100", true),
      opt("993 is faster than 100 because it's a higher number", false, "Port numbers say nothing about speed. 993 is simply where the server listens for encrypted IMAP."),
      opt("Last night's update had switched her phone to POP3", false, "It was still IMAP. Only the port was wrong."),
      opt("993 is the port the phone sends mail on", false, "Sending is SMTP, on 587. 993 is for receiving over IMAP."),
      opt("The mail server was down until she changed the port", false, "The server was fine the whole time: her phone was knocking on the wrong door."),
      opt("TechCom phones only work on port 993", false, "Any phone uses 993 for encrypted IMAP. It's the server's port, not the phone's.")] },
    note: { must: [["993"], ["imap"], ["port"], ["ssl", "tls", "encrypt"]], tip: "say what was wrong, what she changed, and how you confirmed it." } }),

  /* CE2: can't send (walk) */
  chatTicket({ id: "CE2", sim: "Help Desk Chat: Email Issue", title: "John's phone won't send email",
    from: "John Doe, HR", site: "Rafiki's IT Services, Office 1", channel: "email", mood: 1,
    brief: ["John Doe has started a chat: his phone reads email but won't send it.", "His company phone is enrolled in Mobile devices."],
    phone: { owner: "John Doe", model: "TechCom T7", account: { email: "jdoe@rafiki.local", proto: "IMAP", sec: "SSL/TLS", server: "mail.rafiki.local", port: 993, out: { server: "mail.rafiki.local", port: 25, sec: "None", auth: false }, pass: "current" } },
    chat: [
      { type: "reply", cust: ["Hi. I can read email on my phone but nothing I send ever goes. It all just sits in the Outbox."], h: ["He's frustrated already. How do you open?", "Acknowledge the problem and offer help before anything else."],
        right: ok("Hello John, I'm sorry about that. I'll help you get them sending."), wrong: [
        no("Delete the Outbox and write them again.", "They're important replies, I don't want to lose them!", "Deleting the stuck mail loses his work and fixes nothing."),
        no("Have you tried sending smaller emails?", "They're one-line replies. They're tiny.", "Size isn't it when even short replies stick."),
        no("Hello John, that's probably just your mobile signal. Try sending them again later.", "I've got full signal and I'm reading mail fine!", "Receiving works, so the signal is fine. Don't guess."),
        no("Use your laptop to send instead.", "I'm out on visits all day, that's why I have the phone.", "A workaround isn't a fix."),
        no("Hello John. Which emails did you send? I'll check the people you wrote to exist.", "All of them are stuck, to everyone.", "It's every message, so it isn't one address."),
        no("Blow on the SIM card.", "Is that... a joke?", "A joke, and the SIM card has nothing to do with sending mail."),
        no("Sending is the mail team's area, not ours.", "Then who do I talk to?", "Mail on company phones is the help desk's job."),
        no("Hello John. Nobody else has reported this today, so it must be something you're doing.", "Well, it's happening to me!", "Blaming him helps nobody.")] },
      { type: "reply", cust: ["It's my company phone. Reading is fine, it's only sending."], h: ["Receiving works and sending doesn't. Which half of the mail settings does that point at?", "Mail comes in one way (IMAP or POP3) and goes out another (SMTP). When only one direction fails, look at that side's settings."],
        right: ok("Thanks. Since receiving works, let's look at the outgoing server settings on your phone."), wrong: [
        no("Thanks. Then let's start by checking the incoming server settings on your phone, to be safe.", "But incoming works fine...", "Receiving works, so the incoming side is fine. Sending is the outgoing (SMTP) side."),
        no("Reset your phone's network settings.", "That'll forget all my Wi-Fi passwords, won't it?", "The phone reaches the server fine: it reads mail."),
        no("Update the phone and try again.", "It updated last week. Still stuck.", "Updates don't change mail server settings."),
        no("Thanks. The quickest fix is to remove the email account from your phone and add it again.", "Won't I lose the stuck emails?", "Re-adding copies the same settings back, and loses his Outbox."),
        no("Thanks. Your mailbox is probably full, so empty your Deleted Items and Sent folders first.", "I can still receive, so it isn't full, is it?", "A full mailbox stops receiving, not sending."),
        no("Turn off Wi-Fi and use mobile data.", "Tried that. Still stuck.", "It fails on both, so it's not the network."),
        no("The people you're writing to must be blocking you.", "All of them? Even my boss?", "Every message to everyone sticks: it's his phone's sending."),
        no("Take the SIM out and put it back in.", "Done that already. Nothing.", "The SIM card doesn't decide how mail is sent.")] },
      compare("John", ["Here are my outgoing settings.", { attach: { title: "Outgoing Server", rows: [["Server", "mail.rafiki.local"], ["Port", "25"], ["Security", "None"], ["Requires sign-in", "Off"]] } }]),
      { type: "reply", h: ["Line his outgoing settings up against what the mail server accepts for sending. More than one thing differs.", "Phones send through SMTP submission: its own port, with encryption, and signed in. Mobile carriers block the old server-to-server port."],
        right: ok("Please change the outgoing port to 587, set security to STARTTLS, and turn on 'requires sign-in'."), then: change({ "out.port": 587, "out.sec": "STARTTLS", "out.auth": true }), wrong: [
        no("Please change the outgoing port to 465, and leave the security and sign-in settings as they are now.", "465... still stuck. I've put it back.", "This server takes mail on 587 with STARTTLS. 465 is an older SSL port it doesn't use."),
        no("Change the outgoing port to 993.", "Tried 993: it says it can't send. Put it back.", "993 is IMAP, for receiving. Sending is SMTP."),
        no("Change the outgoing port to 110.", "Still stuck. Back to how it was.", "110 is POP3 without encryption: receiving, not sending."),
        no("Please keep the outgoing port on 25, set security to STARTTLS, and turn on 'requires sign-in' too.", "Turned sign-in on... still stuck. Turned it off again.", "Mobile carriers block port 25 outright. It has to be 587."),
        no("Please change the outgoing port to 587, leave security as None, and turn on 'requires sign-in'.", "Tried it, now it says the server requires STARTTLS. Put it back.", "The server only accepts sending with STARTTLS on 587."),
        no("Change the outgoing server to smtp.gmail.com.", "That's not ours. I've put it back.", "Company mail goes out through the company server."),
        no("Turn off the phone's firewall.", "There isn't one I can find...", "It's the port, the security and sign-in, not a firewall."),
        no("Use port 80. It's always open.", "Port 80 didn't send either. Back it goes.", "Port 80 is web pages. No mail server listens there.")] },
      confirmSync("John", ["Changed all three. The Outbox is emptying!"], "Mobile devices: John's phone sends over SMTP on 587 with STARTTLS, signed in."),
      closing("They've all gone out. Thanks so much!")
    ],
    close: { prompt: "Why did 587 with STARTTLS and sign-in fix sending?", options: [
      opt("Phones send through SMTP submission on 587, encrypted with STARTTLS and signed in; carriers block port 25", true),
      opt("Port 25 is only for receiving mail", false, "25 is SMTP between mail servers. Carriers block it for phones, so phones use 587."),
      opt("587 is faster than 25", false, "Port numbers aren't speeds."),
      opt("The server was rejecting John's account", false, "His account was fine: he could read mail. The outgoing settings were wrong."),
      opt("STARTTLS alone would have fixed it on port 25", false, "Port 25 is blocked by the carrier whatever the security."),
      opt("Sign-in is only needed for receiving", false, "The server requires sign-in to send too, so it can't be used to relay spam.")] },
    note: { must: [["587"], ["smtp", "outgoing", "sending"], ["starttls", "tls", "encrypt"], ["25"]], tip: "say what was wrong with his outgoing settings, what he changed, and how you confirmed it." } }),

  /* CE3: POP3 pulling mail off the server */
  chatTicket({ id: "CE3", sim: "Help Desk Chat: Email Issue", title: "Farah's emails vanish from her laptop",
    from: "Farah Nkemelu, Finance", site: "Rafiki's IT Services, Office 1", channel: "email", mood: 1,
    brief: ["Farah Nkemelu has started a chat: emails she reads on her phone disappear from her laptop.", "Her company phone is enrolled in Mobile devices."],
    phone: { owner: "Farah Nkemelu", model: "TechCom T7", account: { email: "fnkemelu@rafiki.local", proto: "POP3", sec: "SSL/TLS", server: "mail.rafiki.local", port: 995, out: copy(SERVER_OK), pass: "current" } },
    chat: [
      { type: "reply", cust: ["Hello? Every email I read on my phone disappears from my laptop. Where are they going?!"], h: ["She's worried. How do you open?", "Acknowledge it calmly and offer help. Don't alarm her with guesses."],
        right: ok("Hi Farah, that sounds worrying. I'll help you find out what's happening."), wrong: [
        no("Someone must be deleting your emails.", "Someone's in my mailbox?! Should I be scared?", "Don't alarm her with a guess. Nothing points to anyone else."),
        no("Hi Farah. It sounds like your laptop's mail program is broken, so please reinstall it.", "Reinstall? I need it for work today!", "Nothing points to the laptop."),
        no("Check your Deleted Items folder.", "They're not in Deleted Items.", "She's told you they vanish. Greet her and investigate properly."),
        no("Hi Farah. I'm afraid that's just how phones work: you can only read mail in one place.", "That can't be right. Everyone else reads on both.", "Not true: IMAP keeps mail in step on every device."),
        no("Stop reading emails on your phone.", "That's the whole point of having it!", "That avoids the problem instead of fixing it."),
        no("Blow on the SIM card.", "...Pardon?", "A joke, and nothing to do with where mail is kept."),
        no("Hi Farah, don't worry. Your mailbox is over its quota, so it's deleting old mail by itself.", "These are new emails, though.", "A quota stops new mail arriving; it doesn't delete what she reads."),
        no("Please email us the details instead.", "I'm chatting with you right now!", "She's already reached you. Help her here.")] },
      { type: "reply", cust: ["It's my company phone. On the laptop they're just gone once I've opened them on the phone."], h: ["They vanish exactly when she reads them on the phone. Where would you look?", "When one device's actions change what another sees, look at how that device's account is set up."],
        right: ok("Let's look at how the email account is set up on your phone."), wrong: [
        no("Let's look at how the email account is set up on your laptop first.", "But it's the phone that makes them vanish...", "They vanish after she reads them on the phone. Start with the phone."),
        no("I'll restore your whole mailbox from last night's backup for you.", "And then they'll vanish again tomorrow?", "Restoring treats the symptom, not the cause."),
        no("Turn on two-factor authentication.", "Will that bring them back?", "2FA protects sign-in; it doesn't change where mail is kept."),
        no("Your phone has a virus that deletes emails.", "A virus?! What do I do?", "No sign of malware. Don't scare her with a guess."),
        no("Please change your password now. Someone else is reading your mail.", "Oh no, really?", "Nothing suggests anyone else: it happens exactly when she reads on the phone."),
        no("Set your laptop to work offline.", "Then I won't get any email on it.", "That stops the laptop syncing at all."),
        no("Factory reset the phone.", "Wipe it? I'd lose everything!", "Far too drastic for how an account is set up."),
        no("It's a known bug. Wait for an update.", "How long will that take?", "You don't know that, and it isn't a bug: it's a setting.")] },
      compare("Farah", ["Here's what my phone shows for the account.", { attach: { title: "Incoming Server", rows: [["Protocol", "POP3"], ["Security", "SSL/TLS"], ["Server", "mail.rafiki.local"], ["Port", "995"]] } }]),
      { type: "reply", h: ["Her phone connects fine. So what is it about how it connects that removes mail from the server?", "POP3 downloads mail to one device and removes it from the server. IMAP leaves it on the server, in step everywhere, on its own encrypted port."],
        right: ok("Your phone uses POP3, which takes mail off the server. Please change the account to IMAP on port 993 with SSL/TLS."), then: change({ proto: "IMAP", port: 993 }), wrong: [
        no("Your phone uses POP3, which is fine as it is. Please keep POP3, but change the port on the account to 993 with SSL/TLS.", "Changed it... now it won't connect at all. I've put it back.", "993 speaks IMAP. The protocol itself has to change."),
        no("Your phone uses POP3, which takes mail off the server. Please change the account to IMAP but keep it on port 995.", "Now it can't connect. Back it goes.", "995 is POP3's port. IMAP over SSL/TLS is 993."),
        no("Change it to IMAP on port 143.", "It says the server closed the connection. Put it back.", "143 is IMAP unencrypted. This server only takes SSL/TLS: 993."),
        no("Change it to Exchange ActiveSync.", "There's no Exchange option for our mail...", "The company server offers IMAP and POP3, not Exchange."),
        no("Switch the laptop to POP3 too, so they match.", "Then my phone won't get them!", "Two POP3 clients fight over the same mail. IMAP keeps both in step."),
        no("Your phone takes mail off the server. Please set it to leave a copy on the server and delete it after 30 days instead.", "So they'd still vanish, just later?", "Still POP3: the laptop would still lose them."),
        no("Turn off SSL so the laptop can see them.", "Turned it off: now it won't connect. Back on.", "Encryption has nothing to do with where mail is kept, and the server requires it."),
        no("Forward all your mail to your personal Gmail.", "Is that allowed?", "Company mail going to a personal account breaks policy and fixes nothing.")] },
      confirmSync("Farah", ["Done, it's IMAP on 993 now."], "Mobile devices: Farah's phone syncs over IMAP on 993; her mail stays on the server.", function (p) { return p.account.proto === "IMAP"; }),
      closing("They're all still on my laptop now. Thank you!")
    ],
    close: { prompt: "Why did switching to IMAP fix it?", options: [
      opt("POP3 downloads mail to one device and removes it from the server; IMAP keeps it on the server, in step on every device", true),
      opt("IMAP is encrypted and POP3 isn't", false, "Both were encrypted here (995 and 993). The difference is where mail is kept."),
      opt("The laptop could only read IMAP mail", false, "The laptop was fine. Mail was being removed from the server by the phone."),
      opt("993 is a faster port", false, "Ports aren't speeds."),
      opt("POP3 was deleting her mail as spam", false, "It wasn't spam: POP3 simply downloads and removes."),
      opt("Her mailbox was full", false, "A full mailbox stops new mail; it doesn't remove what she read.")] },
    note: { must: [["imap"], ["pop3", "pop"], ["993"], ["server"]], tip: "say why mail vanished, what she changed, and how you confirmed it." } }),

  /* CE4: a typo in the server name */
  chatTicket({ id: "CE4", sim: "Help Desk Chat: Email Issue", title: "Rosa's phone can't find the mail server",
    from: "Rosa Ortiz, Reception", site: "Rafiki's IT Services, Reception", channel: "email",
    brief: ["Rosa Ortiz has started a chat: her phone says it can't find the mail server.", "Her company phone is enrolled in Mobile devices."],
    phone: { owner: "Rosa Ortiz", model: "TechCom T7", account: { email: "rortiz@rafiki.local", proto: "IMAP", sec: "SSL/TLS", server: "mail.rafki.local", port: 993, out: { server: "mail.rafki.local", port: 587, sec: "STARTTLS", auth: true }, pass: "current" } },
    chat: [
      { type: "reply", cust: ["Hi, my phone keeps saying 'Cannot find server'. I set up my email myself yesterday."], h: ["How do you open?", "Acknowledge her and offer help. Setting up her own mail is normal: no telling-off."],
        right: ok("Hi Rosa, thanks for getting in touch. I'll help you sort that out."), wrong: [
        no("You shouldn't set things up yourself.", "Well, nobody else was around to do it...", "Scolding her doesn't help, and setting up mail herself is normal."),
        no("The mail server is down.", "But my laptop email works fine...", "Her laptop works, so the server is up. Don't guess."),
        no("Turn your phone off for an hour.", "An hour? I'm on the front desk!", "No reason given, and it fixes nothing."),
        no("Blow on the SIM card.", "Is that really a thing?", "A joke: the SIM has nothing to do with finding a server."),
        no("Hi Rosa, thanks for that. It sounds like your Wi-Fi is blocking it, so use mobile data.", "Tried that. Same message.", "It fails on both, so it isn't the network."),
        no("Hi Rosa, thanks for getting in touch. I'll book a technician visit for you next week.", "Next week? I need it today.", "This is a chat-sized problem. Help now."),
        no("Send me your password and I'll set it up.", "My password? Is that safe?", "Never ask for a password."),
        no("Hi Rosa. I'm sorry, but that message means your phone is broken and needs replacing.", "It's brand new!", "That isn't what the message means at all.")] },
      { type: "reply", cust: ["It's the company phone. The error says it can't find the server."], h: ["Read the error's words: what exactly can't the phone do?", "'Can't find' is about the name. A wrong port says it can't connect; a wrong password says authentication failed."],
        right: ok("'Cannot find server' usually means the server name. Let's check what's typed in your account settings."), wrong: [
        no("'Cannot find server' usually means a wrong password. Let's check the password saved in your account settings.", "It doesn't say anything about the password...", "A wrong password gives 'authentication failed', not 'can't find'."),
        no("Change your port to 995.", "Changed it, same message. I've put it back.", "The port doesn't matter yet: the phone can't find the server at all."),
        no("Restart your router at home.", "I'm at work...", "Nothing to do with her router."),
        no("'Cannot find server' is usually a glitch in the mail app. Please clear the mail app's cache and try again.", "Done it. Same error.", "A cache doesn't hold the server's name."),
        no("Update your phone.", "It says it's up to date.", "Updates don't change what she typed."),
        no("That means the server has been hacked.", "Hacked?! Should I tell someone?", "Never alarm a customer with a guess."),
        no("Turn airplane mode on and off.", "Did it. Same message.", "Toggling isn't troubleshooting. Read what the error says."),
        no("'Cannot find server' usually means the server's certificate has expired. I'll ask the mail team to renew it.", "What does that mean?", "A certificate error looks different. This one says it can't find the server.")] },
      compare("Rosa", ["Here's my account screen.", { attach: { title: "Incoming Server", rows: [["Protocol", "IMAP"], ["Security", "SSL/TLS"], ["Server", "mail.rafki.local"], ["Port", "993"]] } }]),
      { type: "reply", h: ["Read her server name letter by letter against the mail server's real name.", "A phone can only find a server by its exact name. One missing letter is a different name, on the incoming and outgoing servers alike."],
        right: ok("The server name has a typo: it should be mail.rafiki.local. Please correct it on both the incoming and outgoing servers."), then: change({ server: "mail.rafiki.local", "out.server": "mail.rafiki.local" }), wrong: [
        no("Change the server to 10.0.0.1.", "Still can't find it. I've put it back.", "That isn't the server's address. The name just needs its missing letter."),
        no("The server name has a typo: it should be mail.rafiki.com. Please correct it on both the incoming and outgoing servers now.", "Still can't find it. Back it goes.", "Our mail server is mail.rafiki.local. .com isn't ours."),
        no("Change the port to 995.", "Same error. Put it back.", "The port can't help while the name is misspelled."),
        no("Change the protocol to POP3.", "Same thing. Back to IMAP.", "The protocol isn't the problem: the server's name is."),
        no("Turn off SSL.", "Same error, and now it warns me it's not secure. Back on.", "Encryption has nothing to do with finding the server."),
        no("The server name has a typo: it should be mail.rafiki.local. Please correct it on the incoming server, and leave the outgoing.", "Incoming works now, but sending still says it can't find the server.", "The typo is in both servers. Fix both."),
        no("The server name looks wrong, so please delete the account and let the phone find the right settings for itself automatically.", "It just asked me to type the server in again...", "Auto-setup needs the domain to publish its settings; ours doesn't. Fix the typo."),
        no("Use mail.google.com. It's more reliable.", "That's not our email!", "Company mail is on the company server.")] },
      confirmSync("Rosa", ["Fixed it on both. It's downloading!"], "Mobile devices: Rosa's phone reaches mail.rafiki.local for incoming and outgoing mail."),
      closing("All my emails are here now. Thanks!")
    ],
    close: { prompt: "What was wrong, in one line?", options: [
      opt("The server name was misspelled (mail.rafki.local), so the phone couldn't find the server at all", true),
      opt("The port was wrong", false, "993 was right. The phone never got as far as the port."),
      opt("Her password had expired", false, "That gives 'authentication failed'. This said it couldn't find the server."),
      opt("The mail server was down", false, "Her laptop worked the whole time."),
      opt("Reception's Wi-Fi blocks email", false, "It failed on mobile data too."),
      opt("POP3 should have been used", false, "IMAP was right. The name was wrong.")] },
    note: { must: [["mail.rafiki.local", "server name", "typo", "misspel"], ["incoming"], ["outgoing"]], tip: "say what was typed wrong, where she corrected it, and how you confirmed it." } }),

  /* CE5: the phone still has the old password */
  chatTicket({ id: "CE5", sim: "Help Desk Chat: Email Issue", title: "Dev's phone keeps saying password incorrect",
    from: "Dev Patel, Dev", site: "Rafiki's IT Services, Office 3", channel: "email", mood: 1,
    brief: ["Dev Patel has started a chat: his phone keeps asking for his email password.", "His company phone is enrolled in Mobile devices."],
    phone: { owner: "Dev Patel", model: "TechCom T7", account: { email: "dpatel@rafiki.local", proto: "IMAP", sec: "SSL/TLS", server: "mail.rafiki.local", port: 993, out: copy(SERVER_OK), pass: "old" }, password: "current" },
    chat: [
      { type: "reply", cust: ["My phone keeps popping up 'password incorrect' for email. It worked yesterday."], h: ["How do you open?", "Acknowledge it and offer help. Never ask for a password."],
        right: ok("Hi Dev, I'm sorry about the pop-ups. Let's get that fixed for you."), wrong: [
        no("Hi Dev, sorry about the pop-ups. What's your password? I'll check it's right for you.", "Should I really tell you that?", "Never ask for a password."),
        no("Your account has been hacked.", "Hacked?! What do I do?", "Jumping to the scariest guess. Find out what changed first."),
        no("Hi Dev. I'd just ignore the pop-ups for now: it usually sorts itself out by tomorrow.", "It's stopped my email working...", "It won't fix itself."),
        no("Blow on the SIM card.", "Ha. Very funny. Can you actually help?", "A joke: the SIM card doesn't hold email passwords."),
        no("Delete the email app.", "Then I'd have no email at all.", "Removing the app fixes nothing."),
        no("Hi Dev, sorry about that. The mail server is rejecting everyone's passwords today.", "My laptop works fine...", "His laptop works, so the server's fine."),
        no("You'll need a new phone.", "For a password pop-up?", "Nothing is wrong with the hardware."),
        no("Please call the main office number instead.", "I'm already talking to you...", "He's reached you. Help here.")] },
      { type: "reply", cust: ["It's the company phone. My laptop's fine though. I changed my password this morning when it told me it had expired."], h: ["What changed this morning, and which device hasn't heard about it?", "A device that saved your old password keeps offering it after a change, and the server keeps refusing it."],
        right: ok("That explains it: the phone is still using your old password. Let's update it on the phone."), wrong: [
        no("That explains it: the phone doesn't know the new one. Please change your password back to the old one.", "Can I even do that?", "Reusing an old password defeats the expiry policy."),
        no("I'll reset your password again.", "Again? I only just changed it!", "A new reset would break the laptop too. The phone just needs the new one."),
        no("That explains it. I'll turn off password expiry on your account, so this never happens again.", "Is that allowed?", "That weakens security, it isn't a Tier 1 change, and it isn't the fix."),
        no("Remove the phone from Mobile devices.", "Then I won't get company mail at all.", "Unenrolling cuts him off entirely."),
        no("Your account is locked. Wait 30 minutes.", "It doesn't say locked...", "It says 'incorrect', which fits an old saved password."),
        no("Change the port to 993.", "It's already 993, I think?", "The connection works: the server is refusing the password."),
        no("Use a different email app that doesn't need a password.", "Is there one?", "Every mail app signs in. It needs the new password."),
        no("That explains it: changing passwords upsets the mail server. The mail team will fix it overnight.", "Overnight?! I need email now.", "It's his phone's saved password. Fix it now.")] },
      { type: "do", act: "sync", cust: ["Here's the error it gives.", { attach: { title: "Email", rows: [["Account", "dpatel@rafiki.local"], ["Status", "Authentication failed"], ["Last sync", "Yesterday 17:42"]] } }],
        doing: "See it for yourself: in Mobile devices, press Sync now on Dev's phone and read exactly what the server says.",
        done: function (fleet, t) { const p = phoneOf(fleet, t); return !!p && MB.seen(p, "student-sync") > 0; },
        after: "Mobile devices: Dev's phone gets 'Authentication failed'. The connection works; the password doesn't.",
        h: ["Don't rely on the screenshot alone: what does the phone say when you make it check now?", "Read the exact error: it tells you whether it's the name, the connection, the encryption or the password."],
        moves: [opt("Press Sync now on Dev's phone in Mobile devices and read the error", true), opt("Ask Dev for his new password to test it", false, "Never ask for a password."), opt("Reset his password", false, "He's just changed it. A reset breaks his laptop too."), opt("Escalate to the mail team", false, "It's his phone's saved password: Tier 1's job."), opt("Wipe the phone remotely", false, "Destroys everything for a password."), opt("Tell him to wait until tomorrow", false, "It won't fix itself.")] },
      { type: "reply", h: ["The connection is fine and the server refuses the password. Where does the phone keep it, and who should type it?", "The person whose password it is updates it on the device themselves, in the account's settings. It is never typed into a chat."],
        right: ok("Please open Settings, then Accounts, then your email, enter your new password there, and save. Don't type it here."), then: change({ pass: "current" }), wrong: [
        no("To save you the trouble, please type your new password here in the chat, and I'll enter it on the phone for you remotely.", "Isn't that... not allowed?", "Never ask for a password in a chat. He types it on the phone himself."),
        no("Please open Settings, then Accounts, then your email, remove the account, and add it again with your old password there.", "The old one doesn't work any more...", "The old password is exactly the problem."),
        no("Please open Settings, then Accounts, then your email, enter your new password, and change the port to 995 there as well.", "Now it won't connect at all. I've put it back.", "The port was fine. Only the password changes."),
        no("Wait for the phone to ask for the new password on its own.", "It just keeps saying incorrect...", "It won't ask nicely: update it in the account settings."),
        no("Turn on airplane mode so it stops asking.", "Then I get no email at all.", "That hides the problem and fixes nothing."),
        no("Write your new password on a sticky note on the back of the phone.", "Is that... wise?", "Never write a password where others can find it."),
        no("Use your phone's PIN instead of your password.", "My phone PIN? For email?", "The mail server needs the account password, not the phone's PIN."),
        no("Reset the phone so it picks up the new password.", "Wipe it? For a password?", "Wildly out of proportion: update the saved password.")] },
      confirmSync("Dev", ["Done, I've put the new one in."], "Mobile devices: Dev's phone signs in and syncs with his new password."),
      closing("No more pop-ups. Brilliant, thanks!")
    ],
    close: { prompt: "Why did his phone fail after he changed his password?", options: [
      opt("It had saved his old password and kept offering it; the server refused it until he entered the new one on the phone", true),
      opt("Password expiry locked his account", false, "His laptop worked: the account was fine."),
      opt("The port changed when his password did", false, "Ports don't change with passwords."),
      opt("Changing the password turned off SSL", false, "Unrelated: the connection worked; the password didn't."),
      opt("The phone needed a factory reset after a password change", false, "Updating the saved password is all it needs."),
      opt("Someone else changed his password", false, "He changed it himself this morning.")] },
    note: { must: [["password"], ["phone", "device"], ["expired", "changed", "new"]], tip: "say why it failed, what he updated (without the password itself), and how you confirmed it." } }),

  /* CE6: a friend switched encryption off */
  chatTicket({ id: "CE6", sim: "Help Desk Chat: Email Issue", title: "Brenda's email stopped after a friend 'fixed' it",
    from: "Brenda Smith, Sales", site: "Rafiki's IT Services, Office 2", channel: "email", mood: 1,
    brief: ["Brenda Smith is back in the chat: a friend changed her phone's email settings and now nothing connects.", "Her company phone is enrolled in Mobile devices."],
    phone: { owner: "Brenda Smith", model: "TechCom T7", account: { email: "bsmith@rafiki.local", proto: "IMAP", sec: "None", server: "mail.rafiki.local", port: 143, out: copy(SERVER_OK), pass: "current" } },
    chat: [
      { type: "reply", cust: ["Hi again! A friend 'fixed' my phone's email settings and now it won't connect at all."], h: ["A returning customer, a bit embarrassed. How do you open?", "Greet her warmly and offer help. Policy can come later, kindly."],
        right: ok("Hi Brenda, good to hear from you again. Let's get it connecting."), wrong: [
        no("Hi Brenda. To be honest, your friend really shouldn't touch company phones at all.", "I know, I know... can you help though?", "True, but leading with a telling-off doesn't help. Help first."),
        no("Ask your friend to fix it then.", "He's gone home...", "It's the help desk's job."),
        no("Factory reset the phone to undo everything.", "I'd lose everything!", "Far too drastic: only the mail settings changed."),
        no("Blow on the SIM card.", "That's what my friend said too!", "A joke, and still nothing to do with email."),
        no("Hi Brenda. The mail server automatically rejects phones that have been tampered with.", "Tampered?! Am I in trouble?", "Not true, and alarming. It's just a setting."),
        no("Hi Brenda, good to hear from you. I'm afraid we don't support changes other people make.", "So I'm stuck with no email?", "Company phone mail is supported whoever changed it."),
        no("Did your friend install anything?", "No, he only changed some settings.", "Fair to ask later, but greet her and look at the settings first."),
        no("Restart your phone.", "Done it twice. Still nothing.", "Restarting won't undo changed settings.")] },
      { type: "reply", cust: ["He said the old settings were 'too slow' and changed something about the security."], h: ["She's told you roughly what changed. Where do you look?", "When something worked until a change, look at what was changed."],
        right: ok("Thanks, that helps. Let's look at what your mail settings are now."), wrong: [
        no("Thanks, that helps. Security settings never affect speed, so your friend was just wrong.", "OK... but how do I fix it?", "Correcting the friend doesn't fix her phone."),
        no("Thanks, that helps. Then let's turn the security off completely, so it's nice and fast.", "Is that safe?", "Never weaken security, and this server requires encryption anyway."),
        no("Thanks, that helps. Please change your password first, because your friend might have seen it.", "Oh. Should I?", "Maybe later, but it isn't why mail won't connect."),
        no("Remove the account and start again from scratch.", "Will I lose emails?", "Look at what changed first."),
        no("Your phone needs a faster processor.", "It's new!", "Speed isn't the problem: it won't connect at all."),
        no("I'll report your friend to IT security.", "He was only trying to help...", "Not the issue right now. Fix her mail."),
        no("Update the phone to make it faster.", "It's up to date.", "Unrelated to the settings that changed."),
        no("Try again tomorrow.", "I need it today...", "Help now.")] },
      compare("Brenda", ["This is what it says now.", { attach: { title: "Incoming Server", rows: [["Protocol", "IMAP"], ["Security", "None"], ["Server", "mail.rafiki.local"], ["Port", "143"]] } }]),
      { type: "reply", h: ["Two settings differ from what the server accepts. Which two?", "This server only takes encrypted IMAP, on IMAP's encrypted port. Security and port go together."],
        right: ok("Please set Security back to SSL/TLS and the port back to 993."), then: change({ sec: "SSL/TLS", port: 993 }), wrong: [
        no("Please set Security back to SSL/TLS, and leave the port at 143 as it is.", "Tried it, can't connect. Put it back.", "SSL/TLS IMAP uses 993, not 143."),
        no("Please leave Security turned off, and set the port back to 993.", "Still can't connect. Back it goes.", "993 only speaks encrypted IMAP. Security must be SSL/TLS."),
        no("Set Security to STARTTLS on port 143.", "It says the server closed the connection. Put it back.", "This server only takes SSL/TLS on 993 for incoming mail."),
        no("Change the protocol to POP3 on port 110.", "Still no. Back to how it was.", "Unencrypted POP3 fails too, and POP3 would pull mail off the server."),
        no("Change the port to 587.", "Nope. Put it back.", "587 is for sending."),
        no("Turn off Wi-Fi to make it faster.", "Now nothing loads at all...", "Speed isn't the problem."),
        no("Accept any security warning and carry on.", "There's no warning. It just fails.", "Never click through security warnings to get around a problem."),
        no("Please change the server name to its IP address instead, 10.0.8.1.", "Same thing. Back.", "The address was fine. The security and the port changed.")] },
      confirmSync("Brenda", ["Done. It's connecting again!"], "Mobile devices: Brenda's phone syncs over IMAP on 993 with SSL/TLS again."),
      closing("All working. And I'll tell him not to touch it!")
    ],
    close: { prompt: "Why did 'None' on port 143 fail?", options: [
      opt("The server only accepts encrypted IMAP (SSL/TLS on 993); unencrypted IMAP on 143 is refused", true),
      opt("143 is too slow for modern phones", false, "Ports aren't speeds. 143 is unencrypted IMAP, which this server refuses."),
      opt("The friend also changed her password", false, "Her password was fine."),
      opt("143 is a sending port", false, "143 is IMAP, for receiving, without encryption."),
      opt("SSL makes email slower, so the server blocks it", false, "The server requires encryption, it doesn't block it."),
      opt("The phone was blocked for being tampered with", false, "Nothing was blocked: the settings were wrong.")] },
    note: { must: [["993"], ["ssl", "tls", "encrypt"], ["143"]], tip: "say what had been changed, what she put back, and how you confirmed it." } })
];

/* ------------------------------------------------ the router chats' pieces */
function routerOf(fleet, t) { return R.get(fleet, t.id); }
function rLast(r, test) { const e = r.events.filter(test); return e.length ? e[e.length - 1].at : -1; }
function viewedAfter(r, tab, kind) { return rLast(r, function (e) { return e.kind === "view" && e.tab === tab; }) > rLast(r, function (e) { return e.kind === kind; }); }
function viewed(r, tab) { return rLast(r, function (e) { return e.kind === "view" && e.tab === tab; }) >= 0; }
/* the customer changes their own router, as asked: typed, saved, restarted,
   and their devices told the new Wi-Fi details */
function onRouter(edits, opts) { opts = opts || {}; return function (fleet, t) {
  const r = routerOf(fleet, t);
  Object.keys(edits).forEach(function (k) { R.edit(fleet, r, k, edits[k]); });
  if (edits["wifi.ssid"] || edits["wifi.pass"]) r.devices.forEach(function (d) { if (edits["wifi.ssid"]) d.ssid = edits["wifi.ssid"]; if (edits["wifi.pass"]) d.knows = edits["wifi.pass"]; });
  if (opts.save !== false) R.save(fleet, r);
  if (opts.reboot !== false) R.reboot(fleet, r);
}; }
function look(who, tab, label, done, after, h) { return { type: "do", act: "view", tab: tab, label: label, cust: [], doing: "Check " + who + "'s router yourself: it's shared in the 92 Series app. Open its " + label + " page.",
  done: function (fleet, t) { const r = routerOf(fleet, t); return !!r && done(r); }, after: after, h: h,
  moves: [opt("Open " + who + "'s router in the 92 Series app and read its " + label + " page", true), opt("Take " + who + "'s word for it", false, "Check it yourself: the router is shared with you."), opt("Factory reset the router to be sure", false, "That wipes everything they've set up."), opt("Ask " + who + " for the router's admin password", false, "You don't need it: the router is shared in the app."), opt("Escalate to Tier 2", false, "Reading a page is Tier 1's job."), opt("Close the chat", false, "Not before you've checked.")] }; }
function devices(names, o) { return names.map(function (n, i) { return Object.assign({ name: n, mac: "5C:" + (10 + i) + ":7A:3B:2C:" + (40 + i), wpa3: true, ssid: "92Series-4F1A", knows: "92series1234" }, (o || {})[n] || {}); }); }
const STICKER_DEV = ["Front desk PC", "Office laptop", "Card reader"];

/* --------------------------------------------------------- the router chats */
const CR = [
  /* CR1: the sim itself, word for word */
  chatTicket({ id: "CR1", base: true, sim: "Help Desk Chat: Router Setup", title: "A new router to set up at Shah Accounting",
    from: "Priya Shah, Shah Accounting", site: "Shah Accounting", channel: "router",
    brief: ["Priya Shah has started a chat about the replacement router for her office.", "She has shared it with Rafiki's IT Services in the 92 Series app, so you can see it from your laptop."],
    router: { site: "Shah Accounting", customer: "Priya Shah", devices: devices(STICKER_DEV) },
    chat: [
      { type: "reply", cust: ["I just received a new router for the office, and I need help setting it up."], h: ["A customer has just arrived in the chat. What does every good support conversation open with?", "Open politely and offer help. Don't brush them off or send them elsewhere."],
        right: ok("I am happy to assist you today."), wrong: [
        no("Have you tried using the FAQ?", "I'd rather talk to a person. That's why I'm here.", "Pointing her at the FAQ when she's asked for help is a brush-off."),
        no("Just plug it in. It sets itself up.", "It's asking me for a password, though...", "A router needs securing, not just plugging in."),
        no("Return it. We only support the old model.", "Return it? The old one broke!", "Not true, and no help."),
        no("What's the Wi-Fi password on the sticker? I'll do it for you.", "Should I read that out?", "Don't collect passwords in a chat. Guide her through it."),
        no("Factory reset it before we start.", "It's brand new, straight out of the box...", "There's nothing to reset on a new router."),
        no("I'll book a technician to come out next week.", "Next week? We need it today.", "This is a chat-sized job. Help now."),
        no("Routers aren't covered by the help desk.", "It's the office router...", "The office router is exactly what we support."),
        no("Send me a photo of the box first.", "A photo of the box?", "Unnecessary. Greet her and find out what she needs.")] },
      { type: "reply", cust: ["I need to set up my basic security setting."], h: ["Before you tell her what to do, what do you need to know about this router's situation?", "Ask before you advise: whether it's new or replacing one changes what needs doing."],
        right: ok("Is this the first router in your office?"), wrong: [
        no("You should know how to do that!", "Well, I don't. That's why I contacted you.", "Belittling the customer is never acceptable."),
        no("This is wasting my time!", "Excuse me?!", "Rude and unprofessional, whatever the job."),
        no("Turn off the Wi-Fi so nobody can hack it.", "Then how do we use it?", "That isn't securing it, it's switching it off."),
        no("Hide the network name and you're secure.", "Is that all it takes?", "Hiding the name isn't security."),
        no("Just keep the settings on the sticker. They're secure.", "Are they? Anyone can see the sticker...", "The sticker's defaults are published for every unit."),
        no("Security is optional for small offices.", "Is it? We hold our clients' data...", "Never true, least of all for an accountant."),
        no("Give me remote access to your PC and I'll do it.", "Can't I do it myself with your help?", "Unnecessary: she's on the router page and can be guided."),
        no("Buy a firewall as well. Routers aren't secure.", "We've only just bought this...", "Upselling isn't securing it.")] },
      { type: "reply", cust: ["No, it is a replacement. The last router broke. I am currently logged in and connected to the router's web page.", { who: "you", text: "The first thing you need to do is change the default password." }], h: ["She's about to choose the router's new admin password. What makes one worth having?", "A router's admin password must be one nobody else knows or can guess: not printed on it, not shared, not blank, and long and mixed."],
        right: ok("Create a new password with an uppercase, a lowercase, and special character."), then: function (fleet, t) { const r = routerOf(fleet, t), p = "Shah#Ledger-2026"; R.setAdminPass(fleet, r, r.form.admin.pass, p, p); R.save(fleet, r); }, wrong: [
        no("Type the password printed on the label on the bottom of the router.", "That's the one it already has...", "The label's password is the default: printed on every unit and published online."),
        no("Use Summer21 as the administrative password so we can assist you in the future.", "Summer21? That seems easy to guess...", "A shared, guessable password is no protection at all."),
        no("Leave the password field blank for easy access in the future.", "Blank? Then anyone could get in!", "No password means anyone on the network can take over the router."),
        no("Use the same administrative password as the old router, so nothing else changes.", "The old one's was 'admin'...", "Reusing an old, here default, password carries its weakness over."),
        no("Use the office Wi-Fi password, so there's only one to remember.", "Everyone in the office knows that one.", "The admin password must be different: everyone on the Wi-Fi knows that one."),
        no("Create a new password from your name and birthday, so you'll never forget it.", "That's all on my LinkedIn...", "Personal details are the first thing attackers try."),
        no("Use admin123. It's easy to type.", "Easy to guess too, surely?", "It contains 'admin' and is on every list of common passwords."),
        no("Write the new password on the router's label for whoever comes next.", "Next to the old one?", "Then anyone near the router has it. Store it securely.")] },
      look("Priya", "admin", "Administration", function (r) { return viewedAfter(r, "admin", "admin-pass") && R.strong(r.saved.admin.pass, r.sticker.pass); }, "92 Series app: Priya's new admin password is saved, strong, and not the sticker's.",
        ["She says it's done. Where would you see that from your side?", "Confirm a change on the device itself, not just from what you're told."]),
      { type: "reply", cust: ["That is complete now, and the router is asking to reboot. Should I reboot to move on?"], h: ["The new password is saved. What does the router run until it restarts?", "A router keeps running its old settings until it restarts; Save writes them, the restart puts them into use."],
        right: ok("Yes, reboot please."), then: onRouter({}, { save: false }), wrong: [
        no("If you think you should, you can.", "I don't know, that's why I'm asking!", "Vague: she asked for clear guidance."),
        no("No, it is not necessary.", "Oh... but it says it is.", "The router runs its old settings until it restarts."),
        no("Unplug it for a whole day to be safe.", "A whole day? We'd have no internet!", "A normal restart is all it needs."),
        no("Reboot your computer instead.", "But the router's the one asking...", "The router needs restarting, not the PC."),
        no("Hold the reset button for ten seconds.", "Isn't that the factory reset?", "That wipes the router back to its defaults, password and all."),
        no("Wait until tonight so nobody notices.", "The office is quiet right now...", "No reason to leave the old password in use all day."),
        no("Don't reboot. Just close the page.", "Will the new password work then?", "Without a restart the router keeps running its old settings."),
        no("Reboot it twice to make sure it sticks.", "Twice? Why?", "Once is enough. Twice just interrupts everyone again.")] },
      look("Priya", "status", "Status", function (r) { return viewedAfter(r, "status", "reboot") && !R.pending(r) && !R.defaultPass(r); }, "92 Series app: Priya's router restarted and is running its saved settings, with the new password.",
        ["It's restarted. What would tell you it's really running the new settings?", "The Status page says whether the router is running what's saved."])
    ],
    end: ["It's back up, and the new password works. Thank you!"],
    close: { prompt: "Why change the admin password first?", options: [
      opt("The sticker's password is the same on every unit of the model and published online; until it's changed, anyone on the network can take the router over", true),
      opt("The router won't connect to the internet until it's changed", false, "It connects either way. That's what makes the default dangerous."),
      opt("It makes the Wi-Fi faster", false, "The admin password has nothing to do with speed."),
      opt("The provider requires it before activating the line", false, "No provider checks this."),
      opt("It protects the Wi-Fi from neighbours", false, "That's the Wi-Fi password. This one protects the router's settings."),
      opt("The old router's password stops working on the new one", false, "The new one starts with its own sticker's password: the risk is that it's public.")] },
    note: { must: [["password"], ["default", "sticker", "label"], ["reboot", "restart"]], tip: "say what she changed, why, and how you confirmed it on the router." } }),

  /* CR2: the Wi-Fi is still on the sticker's name and password (walk) */
  chatTicket({ id: "CR2", sim: "Help Desk Chat: Router Setup", title: "Rivera Plumbing's Wi-Fi is still on the sticker's details",
    from: "Tom Rivera, Rivera Plumbing", site: "Rivera Plumbing", channel: "router",
    brief: ["Tom Rivera has started a chat about the Wi-Fi at his shop.", "His router is shared in the 92 Series app."],
    router: { site: "Rivera Plumbing", customer: "Tom Rivera", devices: devices(STICKER_DEV) },
    prepare: function (r) { r.saved.admin.pass = r.running.admin.pass = r.form.admin.pass = "Rivera#Pipes-2026"; },
    chat: [
      { type: "reply", cust: ["Hi. A customer in our waiting room said our Wi-Fi name is just the router's default. Is that bad?"], h: ["How do you open?", "Thank them for raising it and offer to help. Don't brush it off or alarm them."],
        right: ok("Hi Tom, thanks for asking. I can help you check it and secure it."), wrong: [
        no("Hi Tom, thanks for asking. Your customer is wrong: default names are perfectly fine.", "Oh. Are you sure?", "Not fine: a default name tells everyone exactly which router it is."),
        no("You've been hacked. Unplug it now!", "Hacked?! What do I do?!", "Don't alarm him: nothing says anyone got in."),
        no("Ask your customer how they know so much.", "Er, they just noticed it...", "Irrelevant. Help Tom."),
        no("Blow on the SIM card.", "The router doesn't have a SIM card...", "A joke, and routers don't have SIM cards."),
        no("Turn the Wi-Fi off so customers can't see it.", "But we use it for the card reader...", "Switching it off isn't securing it."),
        no("Hi Tom, thanks for asking, but that's really a question for your internet provider.", "It's your router app I'm using...", "It's his router: we support it."),
        no("Defaults are only a problem for big companies.", "We take card payments here...", "Every business is a target, small ones included."),
        no("Hi Tom. Read me your Wi-Fi password and I'll tell you whether it's strong enough.", "Should I really type it here?", "Never collect passwords in chat. You can check it in the app.")] },
      { type: "reply", cust: ["It's the 92 Series router. The name and the Wi-Fi password are both the ones printed on the sticker."], h: ["Who else knows what's printed on that sticker?", "Anything printed on a device is known to everyone who has seen one like it. Both the name and the key should be changed, and the security type checked."],
        right: ok("Then anyone who has seen that sticker could get on. Let's change both, and check the security type while we're there."), wrong: [
        no("Then anyone who has seen that sticker knows your network's name. Let's just change the name, as the password is fine.", "So people can still join with the sticker password?", "The sticker's password is the real problem: anyone who's seen it can join."),
        no("Then anyone who has seen that sticker could find it. Let's hide the network name, so nobody can see it to join it at all.", "Will that stop people joining?", "A hidden name still broadcasts, and the key is still the sticker's."),
        no("Put tape over the sticker.", "Ha. Will that do it?", "Every unit of that model has the same kind of details: tape hides nothing."),
        no("Then anyone who has seen that sticker could get on. Let's turn on MAC filtering and leave the name and password as they are.", "What's MAC filtering?", "MAC addresses can be faked. Fix the password and the security type."),
        no("Factory reset it.", "Won't that put it back to... the sticker?", "A reset puts it back to exactly the sticker's details."),
        no("Leave it. Nobody bothers attacking plumbers.", "Really?", "Any open door gets tried."),
        no("Buy a new router with a better sticker.", "We only got this one last week!", "Spending money doesn't fix a setting."),
        no("Give the customer a different network.", "We only have one network...", "First secure the one he has.")] },
      look("Tom", "wireless", "Wireless", function (r) { return viewed(r, "wireless"); }, "92 Series app: Tom's Wi-Fi is still the sticker's name and password, on WPA2.",
        ["Before you tell him what to set, see what it's set to now.", "Read the Wireless page: the network name, the security type and the password."]),
      { type: "reply", h: ["Every device in the shop supports WPA3. What should the name, the password and the security be, and what makes the router use them?", "A name that isn't the default, a long passphrase only staff know, the strongest security every device supports, then Save and restart."],
        right: ok("On the Wireless page, set a new network name, a long passphrase only your staff know, and WPA3-Personal. Then Save and restart."), then: onRouter({ "wifi.ssid": "Rivera-Shop", "wifi.pass": "Copper-Pipes-2026!", "wifi.security": "WPA3" }), wrong: [
        no("On the Wireless page, set a new network name and a long passphrase, and turn security to Open so customers can join it easily.", "Open? Anyone could get on then...", "Open means no encryption at all."),
        no("Set a new name and passphrase, and use WEP.", "WEP? Is that good?", "WEP was broken years ago."),
        no("On the Wireless page, set a new network name, keep the sticker's passphrase so nobody's locked out, and WPA3-Personal. Then Save.", "So the old password still works?", "The sticker's passphrase is the problem."),
        no("On the Wireless page, set a new network name, a long passphrase only your staff know, and WPA3-Personal. Then Save, without restarting.", "Will it switch over then?", "The router runs its old settings until it restarts."),
        no("Use 'password1' as the passphrase. Customers can remember it.", "That seems a bit weak...", "Guessable, and on every list."),
        no("Name the network 'Rivera-Plumbing-Card-Reader'.", "Is that wise?", "Don't advertise what's on the network."),
        no("Make the passphrase the shop's phone number.", "That's on our van...", "Public information is the first thing tried."),
        no("Change it from the sticker's details to the shop owner's name and birthday.", "That's me...", "Personal details are easy to find.")] },
      look("Tom", "status", "Status", function (r) { return viewedAfter(r, "status", "reboot") && r.running.wifi.ssid !== r.sticker.ssid && r.running.wifi.pass !== r.sticker.wifiPass && r.running.wifi.security === "WPA3" && r.devices.every(function (d) { return R.joins(r, d).ok; }); }, "92 Series app: Tom's router runs the new name and passphrase on WPA3, and all three devices are back on.",
        ["He says it's done and he's reconnected his devices. Where do you confirm it?", "Status shows what the router is running and who is connected."]),
      closing("All done, and the card reader's back on. Cheers!")
    ],
    close: { prompt: "Why change the name and the passphrase both?", options: [
      opt("The sticker's details are the same kind on every unit and known to anyone who's seen one; a new name and a private passphrase on WPA3 keep strangers off", true),
      opt("A new name makes the Wi-Fi faster", false, "Names don't affect speed."),
      opt("WPA3 doesn't work with default names", false, "It does. The default details are the risk."),
      opt("The provider requires a custom name", false, "No provider checks this."),
      opt("Default names stop card readers working", false, "The card reader was working on the default."),
      opt("Changing the name logs out hackers automatically", false, "The new passphrase does that; the name alone doesn't.")] },
    note: { must: [["name", "ssid"], ["passphrase", "password"], ["wpa3"]], tip: "say what you changed, why, and how you confirmed it." } }),

  /* CR3: changes typed, never saved, lost in a power cut */
  chatTicket({ id: "CR3", sim: "Help Desk Chat: Router Setup", title: "Ana's new Wi-Fi password came undone",
    from: "Ana Lopez, home customer", site: "The Lopez house", channel: "router", home: true, mood: 1,
    brief: ["Ana Lopez has started a chat: she changed her Wi-Fi password, and after a power cut the old one is back.", "Her router is shared in the 92 Series app."],
    router: { site: "The Lopez house", customer: "Ana Lopez", devices: devices(["Family laptop", "Ana's phone", "Smart TV"]) },
    prepare: function (r) { r.saved.admin.pass = r.running.admin.pass = r.form.admin.pass = "Lopez#Casa-2026"; },
    chat: [
      { type: "reply", cust: ["I changed our Wi-Fi password last night. Then the power went off, and now the old password is back! What happened?"], h: ["How do you open?", "Acknowledge her and offer help. Don't blame her."],
        right: ok("Hi Ana, that's annoying, I'm sorry. Let's work out what happened and get it set properly."), wrong: [
        no("Hi Ana, I'm sorry. It sounds like someone has hacked your router and changed the password back.", "Hacked?! Oh no!", "Don't alarm her: there's a far likelier reason."),
        no("You must have typed it wrong.", "I didn't type it wrong!", "Blaming her helps nobody, and it isn't what happened."),
        no("Power cuts break routers. You need a new one.", "It's working fine otherwise...", "Nothing says it's broken."),
        no("Blow on the SIM card.", "There's no SIM card in a router...", "A joke, and routers have no SIM card."),
        no("Hi Ana, that's annoying, I'm sorry. Buy a battery backup for the router and the problem goes away.", "I'd rather just fix it...", "A UPS is a good idea, but it isn't why the change was lost."),
        no("Hi Ana, I'm sorry, but that's normal: routers forget everything they're told when the power goes.", "Everything? Then why is the old password still there?", "A router keeps its saved settings through a power cut."),
        no("Call your electricity company.", "About my Wi-Fi?", "The power cut was the trigger, not the problem."),
        no("Read me your new password so I can check it.", "Should I type it here?", "Never collect passwords in chat.")] },
      { type: "reply", cust: ["I typed the new password on the Wireless page, it showed it there, and then I closed the app."], h: ["She typed it and closed the app. What's missing from that?", "On a router, typed changes sit on the page; Save writes them to the router; a restart puts them into use. A restart without Save goes back to what was saved."],
        right: ok("It sounds like it was typed but never saved. A restart, like the power cut, goes back to the last saved settings."), wrong: [
        no("It sounds like the power cut corrupted the router's memory, so it went back to the settings it had at the factory.", "Corrupted? Is it broken then?", "It kept its saved settings perfectly: the new one was never saved."),
        no("The app must have a bug.", "Should I uninstall it?", "No bug: closing without Save leaves nothing written."),
        no("Your password was too long, so it was refused.", "It didn't say anything...", "A refused password shows an error. This was never saved."),
        no("The router resets itself every night.", "Every night?!", "Routers don't do that."),
        no("Your devices changed it back.", "My phone did?", "Devices can't change the router's password."),
        no("It sounds like your provider pushed out an update overnight, and a restart after an update resets the Wi-Fi password.", "Can they do that?", "Nothing like that happened: the change was never saved."),
        no("It sounds like it was only typed once. On these routers you need to change the password twice for it to stick properly.", "Twice? Why?", "Once is enough, saved and restarted."),
        no("Leave the old password. It's fine.", "But I wanted to change it...", "She had a reason: help her do it properly.")] },
      look("Ana", "wireless", "Wireless", function (r) { return viewed(r, "wireless"); }, "92 Series app: Ana's router is running its saved settings: the old password is the saved one.",
        ["What does the router hold right now: on the page, saved, and running?", "The bar at the bottom of the app says whether the router is running what's saved, or has changes waiting."]),
      { type: "reply", h: ["The new password needs to be typed, written to the router, and put into use. In what order?", "Type it, Save to write it, then Restart so the router uses it. Devices then need the new password."],
        right: ok("Please type the new password again on the Wireless page, press Save, then Restart router. Then reconnect your devices with it."), then: onRouter({ "wifi.pass": "Sunflower-Lane-77!" }), wrong: [
        no("Type it again and close the app. It'll save itself.", "Isn't that what I did last night?", "Exactly what lost it last time: nothing saves by itself."),
        no("Please type the new password again on the Wireless page, then Restart router, and reconnect your devices with the new password.", "Do I press anything first?", "Restart without Save throws the typed change away again."),
        no("Please type the new password again on the Wireless page and press Save, but don't restart: it applies itself overnight anyway.", "Overnight?", "It applies when the router restarts. Restart it."),
        no("Please factory reset the router to clear the old password, then type the new one on the Wireless page and press Save and restart.", "Won't that wipe everything?", "It wipes all her settings for no reason."),
        no("Change the admin password instead.", "Is that the Wi-Fi one?", "That's the router's own password, not the Wi-Fi's."),
        no("Unplug it for an hour, then type it again.", "An hour without internet?", "Waiting changes nothing. Type, Save, Restart."),
        no("Type it on your phone's Wi-Fi settings instead.", "Then the router won't have it...", "The router holds the password: change it there."),
        no("Ask your internet provider to set it for you.", "Can't I just do it?", "She can, in the app, with Save and Restart.")] },
      look("Ana", "status", "Status", function (r) { return viewedAfter(r, "status", "reboot") && r.running.wifi.pass === "Sunflower-Lane-77!" && !R.pending(r) && r.devices.every(function (d) { return R.joins(r, d).ok; }); }, "92 Series app: Ana's router is running the new password, saved, and every device is back on.",
        ["She's restarted it. How do you know the new password is the one in use?", "Status says whether the router is running what's saved, and who's connected."]),
      closing("It's stayed this time. Thank you!")
    ],
    close: { prompt: "Why did the power cut bring the old password back?", options: [
      opt("The new password was typed but never saved, and any restart loads the last saved settings", true),
      opt("Power cuts reset routers to their factory settings", false, "A factory reset would have brought back the sticker's details. It kept her saved ones."),
      opt("The router was hacked", false, "Nothing points to that: it simply loaded what was saved."),
      opt("The password was too weak to keep", false, "Strength isn't checked on a restart."),
      opt("Her phone changed it back", false, "Devices can't change the router's settings."),
      opt("The provider reset it", false, "No provider touched it.")] },
    note: { must: [["save"], ["restart", "reboot"], ["password"]], tip: "say why it was lost, what she did this time, and how you confirmed it." } }),

  /* CR4: a firmware update */
  chatTicket({ id: "CR4", sim: "Help Desk Chat: Router Setup", title: "Kim Florist's router has an update waiting",
    from: "Grace Kim, Kim Florist", site: "Kim Florist", channel: "router",
    brief: ["Grace Kim has started a chat about an update notice on her router.", "Her router is shared in the 92 Series app."],
    router: { site: "Kim Florist", customer: "Grace Kim", devices: devices(STICKER_DEV), fw: "1.0.4", fwLatest: "1.1.2" },
    prepare: function (r) { r.saved.admin.pass = r.running.admin.pass = r.form.admin.pass = "Kim#Petals-2026"; },
    chat: [
      { type: "reply", cust: ["Our router app says 'Firmware update available'. Should we install it? I'm worried it'll break something."], h: ["How do you open?", "Acknowledge the worry and offer to help: it's a good question to ask."],
        right: ok("Hi Grace, that's a good question to ask. I'll help you do it safely."), wrong: [
        no("Never update. If it works, leave it.", "So I should ignore the notice?", "Updates fix security holes. Leaving them is how routers get taken over."),
        no("Hi Grace, good question. It's probably a virus pretending to be an update, so ignore it.", "A virus?! In the app?", "Don't alarm her: it's the maker's own update notice in the app."),
        no("Updates always break things.", "Then why do they make them?", "Not true, and it scares her off a security fix."),
        no("Blow on the SIM card.", "...There isn't one.", "A joke: routers have no SIM card."),
        no("Hi Grace, good question. You can ignore it: it'll install itself eventually anyway.", "Will it?", "This one waits to be installed."),
        no("You'll need to buy the update.", "Pay for it?", "Firmware updates are free from the maker."),
        no("Ask your nephew. He's good with computers.", "I'm asking you...", "She's asked the help desk: help her."),
        no("Hi Grace, that's a good question, but updating the router is your internet provider's job.", "It's my router...", "It's her router: we support it.")] },
      { type: "reply", cust: ["So should I install it?"], h: ["Why do router makers release firmware, and what's the safe way to apply it?", "Firmware updates fix security holes and bugs. Apply them, at a quiet time, with the settings saved first."],
        right: ok("Yes. Firmware updates fix security holes. Do it at a quiet time, and make sure your settings are saved first."), wrong: [
        no("Yes. Firmware updates fix security holes, so install it right now, in the middle of the lunch rush if you have to.", "Now? We're really busy...", "It restarts the router. Pick a quiet time."),
        no("No, wait for version 2.0.", "When's that?", "Waiting leaves the known holes open."),
        no("Only if the router is slow.", "It's fine speed-wise...", "Updates are about security, not speed."),
        no("Yes. Firmware updates fix security holes, but download it from a website you find on Google, not from the app.", "Is that safe?", "Firmware only from the maker, through the router's own app."),
        no("Install it from the USB stick in the box.", "There's no USB stick...", "The current version comes through the app."),
        no("Yes. Firmware updates fix security holes. Factory reset the router first, then update it, so nothing gets in the way.", "Reset everything?", "Unnecessary: her settings survive the update when saved."),
        no("Update, then unplug it to finish faster.", "Unplug it during the update?", "Never cut power mid-update: it can ruin the router."),
        no("It doesn't matter either way.", "Oh. OK.", "It does matter: it's security.")] },
      look("Grace", "admin", "Administration", function (r) { return viewed(r, "admin"); }, "92 Series app: Grace's router is on firmware 1.0.4; 1.1.2 is available.",
        ["Before she starts, see what version it's on and whether anything is waiting to be saved.", "Administration shows the firmware version; the bar at the bottom shows unsaved changes."]),
      { type: "reply", h: ["She's ready. How does she install it, and what must she not do while it runs?", "Install from the router's own app or page; never switch it off mid-update. It restarts itself."],
        right: ok("On Administration, press Check for updates and let it install. Don't unplug it while it works: it restarts by itself."), then: function (fleet, t) { R.firmware(fleet, routerOf(fleet, t)); }, wrong: [
        no("On Administration, press Check for updates and let it install, then unplug it to make it restart much more quickly afterwards.", "Unplug it while it updates?", "Cutting power mid-update can ruin the router."),
        no("Press the reset button to start the update.", "Isn't that the factory reset?", "That wipes her settings and installs nothing."),
        no("Download the file from a forum and upload it.", "A forum?", "Only the maker's firmware, through its own app."),
        no("Turn the Wi-Fi off first, or it won't install.", "Will everything still work after?", "Unnecessary: it installs with Wi-Fi on."),
        no("Update all your devices first.", "All of them?", "The router updates itself. Devices are separate."),
        no("On Administration, change the admin password first, or the update fails. Then press Check for updates and let it install.", "Is it needed?", "The update doesn't depend on the password."),
        no("On Administration, press Check for updates and let it install, then factory reset the router so the update applies properly.", "Reset afterwards?", "No reset is needed: it keeps her saved settings."),
        no("Leave the notice until next year.", "Is that OK?", "The holes stay open all year.")] },
      look("Grace", "admin", "Administration", function (r) { return viewedAfter(r, "admin", "firmware-update") && r.fw === r.fwLatest; }, "92 Series app: Grace's router is on firmware 1.1.2, with her settings intact.",
        ["She says it restarted. What would prove the new firmware is installed?", "The firmware version on Administration."]),
      closing("All updated, and the shop Wi-Fi's still fine. Thanks!")
    ],
    close: { prompt: "Why update the firmware, and how safely?", options: [
      opt("Updates fix security holes; install from the router's own app at a quiet time, settings saved, and never cut the power while it runs", true),
      opt("Updates make the Wi-Fi reach further", false, "That isn't what firmware updates are for."),
      opt("Only update when something is broken", false, "Security fixes matter most before anything breaks."),
      opt("Install from any website that has the file", false, "Only the maker's firmware, through its own app."),
      opt("Unplug it after starting to speed it up", false, "Cutting power mid-update can ruin the router."),
      opt("Factory reset after every update", false, "Unnecessary: it keeps the saved settings.")] },
    note: { must: [["firmware", "update"], ["1.1.2"], ["security"]], tip: "say why she updated, how it was done safely, and how you confirmed it." } }),

  /* CR5: WPA3 only, and an old laptop that can't */
  chatTicket({ id: "CR5", sim: "Help Desk Chat: Router Setup", title: "Mia's old laptop can't get on the Wi-Fi",
    from: "Mia Torres, home customer", site: "The Torres house", channel: "router", home: true,
    brief: ["Mia Torres has started a chat: her old laptop can't join the Wi-Fi since a security change.", "Her router is shared in the 92 Series app."],
    router: { site: "The Torres house", customer: "Mia Torres", devices: devices(["Mia's phone", "Tablet", "Old laptop"], { "Old laptop": { wpa3: false } }), cfg: { wifi: { ssid: "Torres-Home", pass: "Blue-Kettle-Song-9", security: "WPA3" } } },
    prepare: function (r) { r.saved.admin.pass = r.running.admin.pass = r.form.admin.pass = "Torres#Home-2026"; r.devices.forEach(function (d) { d.ssid = "Torres-Home"; d.knows = "Blue-Kettle-Song-9"; }); },
    chat: [
      { type: "reply", cust: ["Since my son changed our Wi-Fi to the 'most secure' setting, my old laptop won't connect. Everything else is fine."], h: ["How do you open?", "Acknowledge and offer help."],
        right: ok("Hi Mia, thanks for the details. Let's get your laptop back on without losing the security."), wrong: [
        no("Throw the old laptop away.", "It still works fine!", "It works: it needs a compatible setting, not the bin."),
        no("Your son broke the router.", "He was only trying to help...", "Nothing is broken, and blaming helps nobody."),
        no("Hi Mia, thanks for the details. Just turn the router's security off and the laptop will connect.", "Off? Isn't that dangerous?", "Never trade security away for one device."),
        no("Blow on the SIM card.", "The laptop doesn't have one...", "A joke, and no SIM card is involved."),
        no("Restart the laptop until it works.", "I've done it five times...", "Restarting won't add WPA3 support."),
        no("Hi Mia, thanks for the details. I'm afraid old laptops like that can't use modern Wi-Fi any more.", "It used it last week!", "Not true: it used WPA2 last week."),
        no("Hi Mia, thanks. The simplest answer is to plug the laptop into the router with a cable from now on.", "It's a laptop...", "A workaround, not a fix."),
        no("Ask your son. He changed it.", "He's at school...", "She asked us: help her.")] },
      { type: "reply", cust: ["It's an old laptop, about eight years old. It just says it can't connect to this network."], h: ["What did 'most secure' switch the router to, and what can an eight-year-old laptop speak?", "WPA3 is newer than many older devices. A transition mode lets WPA3 devices use WPA3 and older ones WPA2 on the same network."],
        right: ok("Your router is set to WPA3 only, and the laptop is too old for WPA3. Let's check what the router says about it."), wrong: [
        no("It sounds like the laptop's Wi-Fi card has broken. Let's check what the router says about it, then replace the card.", "Should I buy a new one?", "It isn't broken: it doesn't speak WPA3."),
        no("Your router's Wi-Fi password is too long for a laptop that old. Let's check what the router says about it first.", "Should I shorten it?", "Length isn't the issue; the security type is."),
        no("The laptop needs a virus scan.", "A virus?", "Nothing to do with connecting."),
        no("The router is too far away.", "It's in the same room...", "Distance isn't it: everything else connects."),
        no("Old laptops can't see the newer channels. Let's change the router's channel, and the laptop should connect straight away.", "Which channel?", "The channel isn't the problem; the security type is."),
        no("The laptop needs a new battery.", "It's plugged in...", "Power has nothing to do with joining."),
        no("Your neighbours are jamming it.", "Jamming it?!", "Don't alarm her with guesses."),
        no("Hide the network name.", "Will that help?", "Hiding the name doesn't change what security the laptop can use.")] },
      look("Mia", "status", "Status", function (r) { return viewed(r, "status"); }, "92 Series app: Mia's router is on WPA3 only; the old laptop can't join because it only supports WPA2.",
        ["See it from the router's side first.", "Status lists every device and, if it can't join, why."]),
      { type: "reply", h: ["Keep the strongest security for every device that can use it, and let the old laptop in too. Which setting does that?", "WPA2/WPA3 transition mode: newer devices use WPA3, older ones WPA2, on one network."],
        right: ok("On the Wireless page, set security to WPA2/WPA3 (transition), so the laptop can use WPA2 and the rest WPA3. Then Save and restart."), then: onRouter({ "wifi.security": "WPA2/WPA3" }), wrong: [
        no("On the Wireless page, set security to WPA2 only, so every device, the laptop included, uses WPA2 the same way. Then Save and restart.", "Won't the newer devices lose WPA3?", "That drops every device to WPA2. Transition keeps WPA3 where it can."),
        no("Set security to Open, just for today.", "Open? Anyone could join...", "Never open the network."),
        no("Set security to WEP for the old laptop.", "Is WEP OK?", "WEP was broken years ago."),
        no("On the Wireless page, set security to WPA2/WPA3 (transition), so the laptop can use WPA2 and the rest WPA3. Then just Save: there's no need to restart.", "Will it switch then?", "The router runs its old settings until it restarts."),
        no("On the Wireless page, keep WPA3 only, and make a second network with no password just for the old laptop to use. Then Save and restart.", "No password at all?", "An open network is an open door."),
        no("Turn on MAC filtering for the laptop.", "Will that let it on?", "Filtering doesn't change what security it can speak."),
        no("Change the Wi-Fi password.", "To what?", "The password was fine; the security type was the problem."),
        no("Factory reset the router.", "Reset everything?", "It wipes her settings and brings back the sticker's.")] },
      look("Mia", "status", "Status", function (r) { return viewedAfter(r, "status", "reboot") && r.running.wifi.security === "WPA2/WPA3" && r.devices.every(function (d) { return R.joins(r, d).ok; }); }, "92 Series app: Mia's router runs WPA2/WPA3 transition, and every device, the old laptop too, is on.",
        ["She's restarted it. Is the laptop really on?", "Status shows who is connected, and on what."]),
      closing("The laptop's on! Thank you so much.")
    ],
    close: { prompt: "Why WPA2/WPA3 transition and not WPA2 only?", options: [
      opt("Transition lets the old laptop use WPA2 while every newer device keeps WPA3", true),
      opt("WPA2 only would be just as secure", false, "It drops every device to the older protocol."),
      opt("WPA3 doesn't work with laptops", false, "Newer laptops use it fine. This one is too old."),
      opt("Transition mode is faster", false, "It's about compatibility, not speed."),
      opt("The laptop needed a new password", false, "The password was fine."),
      opt("Transition hides the network from neighbours", false, "Nothing to do with hiding.")] },
    note: { must: [["wpa2"], ["wpa3"], ["transition"], ["laptop"]], tip: "say why the laptop couldn't join, what you set, and how you confirmed it." } }),

  /* CR6: evening drop-outs from an overlapping channel */
  chatTicket({ id: "CR6", sim: "Help Desk Chat: Router Setup", title: "Carter Bikes' Wi-Fi drops every evening",
    from: "Ben Carter, Carter Bikes", site: "Carter Bikes", channel: "router", mood: 1,
    brief: ["Ben Carter has started a chat: the shop's Wi-Fi keeps dropping, worst in the evenings.", "His router is shared in the 92 Series app."],
    router: { site: "Carter Bikes", customer: "Ben Carter", devices: devices(["Till", "Card reader", "Workshop tablet"]), neighbours: [{ name: "Next door (café)", ssid: "CafeGuest", channel: 1, width: 20 }, { name: "Flat above", ssid: "Flat2-WiFi", channel: 6, width: 20 }], cfg: { wifi: { channel: 6, width: 40 } } },
    prepare: function (r) { r.saved.admin.pass = r.running.admin.pass = r.form.admin.pass = "Carter#Gears-2026"; },
    chat: [
      { type: "reply", cust: ["Our Wi-Fi keeps dropping, worst in the evenings. The card reader timed out twice last night. This is costing me sales!"], h: ["He's losing money and annoyed. How do you open?", "Acknowledge the impact and offer help."],
        right: ok("Hi Ben, I'm sorry, that's costing you. Let's find out why it's dropping."), wrong: [
        no("Hi Ben, I'm sorry. Evenings are always busy on the internet, so there's nothing we can do.", "So I just lose sales?", "There often is something to do. Don't give up before you've looked."),
        no("Your card reader is faulty.", "The till drops too...", "Everything drops, so it isn't one device."),
        no("Upgrade your broadband.", "We already pay for the fast one...", "A guess, and an upsell."),
        no("Blow on the SIM card.", "Is that a joke?", "A joke: the router has no SIM card."),
        no("Close the shop earlier.", "Seriously?", "Not a fix."),
        no("Hi Ben, I'm sorry, that's costing you. It sounds like someone's stealing your Wi-Fi in the evenings.", "Stealing it?!", "Don't alarm him with a guess."),
        no("Hi Ben, I'm sorry about that. It's your internet provider's fault, so please give them a call.", "They said the line's fine...", "The line is fine; look at the Wi-Fi."),
        no("Restart it every evening.", "Every evening?", "A workaround, not a fix.")] },
      { type: "reply", cust: ["There's a café next door and flats above us. Their Wi-Fi gets busy in the evenings."], h: ["Busy neighbours' Wi-Fi in the evenings. What on the router decides whether his signal and theirs share the air?", "On 2.4 GHz, only channels 1, 6 and 11 don't overlap, and a narrower channel takes less room. The router's scan shows the neighbours' channels."],
        right: ok("That fits: their Wi-Fi may be overlapping yours. Let's see which channels everyone is on."), wrong: [
        no("That fits: their Wi-Fi is overlapping yours. Let's ask the café to switch their Wi-Fi off in the evenings.", "They won't do that...", "You can't control the neighbours; you can choose his channel."),
        no("Move the shop.", "Move the shop?!", "Absurd: choose a clear channel."),
        no("That fits: their Wi-Fi may be getting onto yours. Let's make your Wi-Fi password longer so they can't.", "Will that stop the drops?", "Passwords don't affect interference."),
        no("That fits: their Wi-Fi is overlapping yours. Let's turn your router's power to maximum and drown them out.", "Won't that make it worse for everyone?", "It makes the overlap worse, not better."),
        no("Their Wi-Fi is hacking yours.", "Hacking?!", "Interference isn't hacking."),
        no("Switch to a cable for everything.", "The card reader is wireless...", "A workaround, not a fix."),
        no("Hide your network name.", "Will that stop it?", "Hidden or not, it shares the same air."),
        no("Buy a second router.", "Another one?", "Two routers on overlapping channels make it worse.")] },
      look("Ben", "status", "Status", function (r) { return viewed(r, "status"); }, "92 Series app: Ben's router is on channel 6 at 40 MHz, overlapping the café (1) and the flat (6).",
        ["Read the router's Wi-Fi scan.", "The scan on Status lists the neighbours' channels, and whether this router overlaps them."]),
      { type: "reply", h: ["The neighbours are on 1 and 6. Which channel is left clear, and how wide should his be?", "Only 1, 6 and 11 clear each other at 20 MHz. 40 MHz takes twice the room and overlaps whatever channel it's on."],
        right: ok("On the Wireless page, set the channel to 11 and the width to 20 MHz, so you clear both neighbours. Then Save and restart."), then: onRouter({ "wifi.channel": 11, "wifi.width": 20 }), wrong: [
        no("On the Wireless page, set the channel to 11 and keep the width at 40 MHz for speed, so you clear both neighbours. Then Save.", "Isn't faster better?", "At 40 MHz on 2.4 GHz it still overlaps a neighbour."),
        no("Set the channel to 1 to match the café.", "Same as them?", "The same channel means taking turns with the café."),
        no("Set the channel to 3, between them.", "In the middle?", "Channel 3 overlaps both 1 and 6."),
        no("On the Wireless page, set the channel to 6 and the width to 20 MHz, so you sit between both neighbours. Then Save and restart.", "That's the flat's channel...", "Still on top of the flat above."),
        no("On the Wireless page, set the channel to 11 and the width to 20 MHz, so you clear both neighbours. Then Save, but don't restart.", "Will it change then?", "The router runs its old channel until it restarts."),
        no("Set the channel to Automatic and forget it.", "Will it choose well?", "Here a fixed clear channel is the sure fix."),
        no("Set the width to 80 MHz.", "Is that allowed?", "80 MHz doesn't exist on 2.4 GHz."),
        no("Change the network name so the neighbours can't see it.", "Will that stop the drops?", "Names don't change the air they share.")] },
      look("Ben", "status", "Status", function (r) { return viewedAfter(r, "status", "reboot") && !R.interference(r).length && Number(r.running.wifi.width) === 20; }, "92 Series app: Ben's router is on channel 11 at 20 MHz, clear of both neighbours.",
        ["He's restarted. Does the scan still show an overlap?", "Status says, in words, whether it overlaps a neighbour."]),
      closing("No drop-outs all evening. Thanks!")
    ],
    close: { prompt: "Why channel 11 at 20 MHz?", options: [
      opt("The neighbours are on 1 and 6; on 2.4 GHz only 1, 6 and 11 don't overlap, and 20 MHz keeps to one channel's room", true),
      opt("Higher channels reach further", false, "Channel numbers don't change reach."),
      opt("40 MHz on 11 would have been faster and still clear", false, "40 MHz on 2.4 GHz overlaps a neighbour whatever the channel."),
      opt("Channel 11 is reserved for businesses", false, "No channel is reserved."),
      opt("The café asked for it", false, "The neighbours had no say: their channels decided it."),
      opt("Any channel two away from a neighbour is clear", false, "They need to be five apart: only 1, 6 and 11 clear each other.")] },
    note: { must: [["channel 11", "ch 11"], ["20 mhz", "20mhz"], ["overlap", "interference"]], tip: "say why it dropped, what he set, and how you confirmed it." } })
];

export const CHATS = CE.concat(CR);
