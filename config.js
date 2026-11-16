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
  firebase: {
    apiKey: "AIzaSyDcNpCaNiu_VFi4F_CbQM65vj26rFcnpqQ",
    authDomain: "secretsanta26-59368.firebaseapp.com",
    projectId: "secretsanta26-59368",
    storageBucket: "secretsanta26-59368.firebasestorage.app",
    messagingSenderId: "377117986683",
    appId: "1:377117986683:web:eeac6507e1ccca7f3f77de",
  },
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

  // Song that plays on the welcome screen (stops when people tap "Let me in").
  customAudio: "audio/sleigh-ride.mp3",

  // Sound that plays when a name pops out of the box (ignores the mute button).
  revealSound: "audio/fart.mp3",

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
