// ============================================================
//  SECRET SANTA SETTINGS — this is the only file you edit.
// ============================================================
window.SANTA_CONFIG = {
  title: "🏞️🏠🍁💔's Secret Santa drawing",

  // Everyone in the drawing. Photos go in the faces/ folder named
  // after the person in lowercase, e.g. faces/aneesh.png (or .jpg).
  names: [
    "Aneesh", "Landon", "Ethan", "Rohan", "Mar", "Elissa",
    "Emily", "Dayleigh", "Lucy", "Silas", "Eva",
  ],

  // Paste your Firebase web config here (see README.md, step 1).
  // While this is null the site runs in DEMO MODE: draws are only
  // saved in your own browser, so you can click around and test.
  firebase: null,
  // firebase: {
  //   apiKey: "...",
  //   authDomain: "...",
  //   projectId: "...",
  //   storageBucket: "...",
  //   messagingSenderId: "...",
  //   appId: "...",
  // },

  // SHA-256 hash of the admin reset passcode (default: grinch2026).
  adminPasscodeHash: "c1635f27378dcc417bfff3e34938b6d0fbb6151f3d5b8826111983b9611bdc00",

  // Background music (starts on the welcome screen). Set to null to use
  // the built-in music-box Jingle Bells instead.
  customAudio: "audio/sleigh-ride.mp3",

  // The line shown under each person's name when someone draws them.
  messages: {
    Aneesh: "He prefers anything that involves $100 bills",
    Rohan: "Avoid giving this pig any more food",
    Landon: "Do gift cards to X exist?",
    Ethan: "The definition of tall dark and handsome",
    Mar: "Unfortunately gifting her Jackson isn't an option",
    Eva: "Gift suggestion: a bu**et sized hole in Kam's head",
    Elissa: "dem legzzzzz",
    Emily: "Gift suggestion: a pre-written breakup text for Diego",
    Silas: "Gift suggestion: a CS job offer in this economy",
    Dayleigh: "She doesn't even go here!",
    Lucy: "Someone get her away from DBF for a little, please",
  },
};
