export interface BibleVerse {
  reference: string;
  text: string;
}

export const BIBLE_VERSES: BibleVerse[] = [
  {
    reference: "Philippians 4:13",
    text: "I can do all things through Christ who strengthens me."
  },
  {
    reference: "Jeremiah 29:11",
    text: "'For I know the plans I have for you,' declares the LORD, 'plans to prosper you and not to harm you, plans to give you hope and a future.'"
  },
  {
    reference: "Proverbs 3:5-6",
    text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."
  },
  {
    reference: "Psalm 23:1",
    text: "The LORD is my shepherd; I shall not want."
  },
  {
    reference: "Isaiah 40:31",
    text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
  },
  {
    reference: "Psalm 118:24",
    text: "This is the day that the LORD has made; let us rejoice and be glad in it."
  },
  {
    reference: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest."
  },
  {
    reference: "Joshua 1:9",
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go."
  },
  {
    reference: "Psalm 46:10",
    text: "Be still, and know that I am God."
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
  },
  {
    reference: "1 Corinthians 16:14",
    text: "Do everything in love."
  },
  {
    reference: "Lamentations 3:22-23",
    text: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness."
  },
  {
    reference: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
  },
  {
    reference: "Psalm 27:1",
    text: "The LORD is my light and my salvation—whom shall I fear? The LORD is the stronghold of my life—of whom shall I be afraid?"
  },
  {
    reference: "Proverbs 16:3",
    text: "Commit to the LORD whatever you do, and he will establish your plans."
  },
  {
    reference: "Matthew 6:33",
    text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well."
  },
  {
    reference: "2 Timothy 1:7",
    text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind."
  },
  {
    reference: "Psalm 119:105",
    text: "Your word is a lamp for my feet, a light on my path."
  },
  {
    reference: "Romans 12:12",
    text: "Be joyful in hope, patient in affliction, faithful in prayer."
  },
  {
    reference: "Hebrews 11:1",
    text: "Now faith is confidence in what we hope for and assurance about what we do not see."
  },
  {
    reference: "Psalm 34:8",
    text: "Taste and see that the LORD is good; blessed is the one who takes refuge in him."
  },
  {
    reference: "Isaiah 41:10",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you."
  },
  {
    reference: "1 John 4:19",
    text: "We love because he first loved us."
  },
  {
    reference: "Colossians 3:23",
    text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."
  },
  {
    reference: "Psalm 139:14",
    text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well."
  },
  {
    reference: "1 Thessalonians 5:16-18",
    text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus."
  },
  {
    reference: "Psalm 37:4",
    text: "Take delight in the LORD, and he will give you the desires of your heart."
  },
  {
    reference: "Zephaniah 3:17",
    text: "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you."
  },
  {
    reference: "Galatians 5:22-23",
    text: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control."
  },
  {
    reference: "Psalm 103:1-2",
    text: "Praise the LORD, my soul; all my inmost being, praise his holy name."
  },
  {
    reference: "Numbers 6:24-26",
    text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you; the LORD turn his face toward you and give you peace."
  }
];

export function getVerseOfTheDay(date: Date = new Date()): BibleVerse {
  const year = date.getFullYear();
  const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs((year * 365 + dayOfYear) % BIBLE_VERSES.length);
  return BIBLE_VERSES[index];
}
