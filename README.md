# 🎁 Secret Santa drawing

A one-link Secret Santa site. Everyone opens the same link, picks their own
name, opens a gift box, and their giftee's face pops out. A live checklist
shows who has drawn.

**How it stays anonymous:** the database only stores *who has drawn* and
*which names are taken*, never who drew whom. Each person's result is
saved only on their own phone. (Tip: don't watch the database live while
people are drawing, since seeing two entries appear at the same moment would
give it away.)

---

## Step 1: Make the free database (Firebase, ~5 min)

1. Go to https://console.firebase.google.com and sign in with Google.
2. **Create a project** → any name (e.g. `secret-santa`) → turn **off**
   Google Analytics → Create.
3. Left menu: **Build → Firestore Database → Create database**.
   Pick any location, choose **production mode**, and click Create.
4. Open the **Rules** tab, delete what's there, paste in everything from
   `firestore.rules`, and click **Publish**.
5. Click the ⚙️ gear (top left) → **Project settings**. Scroll to
   "Your apps" → click the **`</>`** (Web) icon → give it any nickname →
   Register app.
6. Copy the `firebaseConfig = { ... }` block it shows you.
7. Open `config.js` and replace `firebase: null,` with
   `firebase: { ...paste here... },`

The demo-mode badge disappears once this is set.

## Step 2: Put it on GitHub Pages (~3 min)

1. https://github.com/new → name it `secret-santa` → **Public** → Create.
2. Click **"uploading an existing file"** and drag in *everything in this
   folder* (index.html, app.js, styles.css, config.js, firestore.rules,
   README.md, plus the faces and audio folders) → **Commit changes**.
3. Repo **Settings → Pages** → Source: *Deploy from a branch* →
   Branch: `main`, folder `/ (root)` → Save.
4. After about a minute your link is `https://<your-username>.github.io/secret-santa/`.
   Text that link to the group chat. 🎄

## Changing things later

| Want to… | Do this |
|---|---|
| Add photos | Drop them in `faces/` (see faces/README.txt) and upload to GitHub |
| Use your own song | Put an mp3 in `audio/`, set `customAudio: "audio/song.mp3"` in config.js |
| Reset the drawing | Tap the faint 🔧 at the bottom of the page → passcode → "Yes, nuke it" |
| Change the passcode | Ask Claude for the hash of your new passcode and paste it into `adminPasscodeHash` |
| Change names | Edit `names` in config.js **before** anyone draws (or reset afterward) |

The default reset passcode is **grinch2026**.

## Notes
- If someone picks the wrong name (or pretends to be someone else), the real
  person will see their name greyed out. They text you, you reset, and
  everyone draws again.
- If someone clears their browser or switches phones, their result is gone
  from the site. That's why the site tells them to screenshot it.
- Music starts when people tap "Let me in" (browsers block audio until you
  tap). There's a mute button in the bottom-left corner.
