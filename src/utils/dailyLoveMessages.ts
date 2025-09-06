// Daily Love Messages for Your Special Someone

export interface LoveMessage {
  day: number;
  message: string;
  theme: string;
  imageFile: string;
}

export const DAILY_LOVE_MESSAGES: LoveMessage[] = [
  {
    day: 1,
    message: "Her sabah uyanıp seni düşünmek, benim için en güzel rutindir. Bugün de gözlerindeki ışık rehberim olsun.",
    theme: "morning",
    imageFile: "love_1.jpeg"
  },
  {
    day: 2,
    message: "Seninle geçirdiğim her an, zamanda kaybolmuş bir hazine gibi. Bu gün de birlikte yeni anılar yaratalım.",
    theme: "time",
    imageFile: "love_2.jpeg"
  },
  {
    day: 3,
    message: "Ellerini tuttuğumda tüm evren durur, sadece bizim kalp atışlarımız yankılanır. Sen benim kozmosumun merkezi.",
    theme: "cosmic",
    imageFile: "love_3.jpeg"
  },
  {
    day: 4,
    message: "Gülüşün benim için en güzel melodi. Bu gün de o melodiyi duymak için sabırsızlanıyorum.",
    theme: "music",
    imageFile: "love_4.jpeg"
  },
  {
    day: 5,
    message: "Seninle olmak, sonsuz bir yolculuğa çıkmak gibi. Her adımda yeni güzellikler keşfediyorum.",
    theme: "journey",
    imageFile: "love_5.jpeg"
  },
  {
    day: 6,
    message: "Hafta sonu geldi, ama sen benim her günüm özel. Seninle geçireceğimiz bu zaman çok değerli.",
    theme: "weekend",
    imageFile: "love_6.jpeg"
  },
  {
    day: 7,
    message: "Haftanın son günü ama aşkımızın hiç sonu yok. Sen benim sonsuz hikayemsin.",
    theme: "eternal",
    imageFile: "love_7.jpeg"
  },
  {
    day: 8,
    message: "Yeni bir hafta, yeni umutlar. En büyük umudum ise her gün seni daha çok sevebilmek.",
    theme: "hope",
    imageFile: "love_8.jpeg"
  },
  {
    day: 9,
    message: "Dokuzuncu gün, dokuzuncu sebep... Seni sevmemin sayısız sebebi var, hepsini anlatmaya ömür yetmez.",
    theme: "reasons",
    imageFile: "love_9.jpeg"
  },
  {
    day: 10,
    message: "On parmağımla on kez sarılmak istiyorum sana. Her sarılış, bir başka dünyanın kapısı.",
    theme: "embrace",
    imageFile: "love_10.jpeg"
  },
  {
    day: 11,
    message: "On birinci gün de aynı heyecan. Seninle yaşadığım aşk hiç eskimiyor, her gün daha da güçleniyor.",
    theme: "excitement",
    imageFile: "love_11.jpeg"
  },
  {
    day: 12,
    message: "On iki ay, dört mevsim... Hangisinde olursak olalım, sen hep benim mevsimim olacaksın.",
    theme: "seasons",
    imageFile: "love_12.jpeg"
  },
  {
    day: 13,
    message: "Uğursuz sayı diyorlar ama benim için değil. Çünkü sen benim tüm şansım, tüm uğurum.",
    theme: "luck",
    imageFile: "love_13.jpeg"
  },
  {
    day: 14,
    message: "On dördüncü gün, on dört karat altın gibi değerli. Sen benim en kıymetli hazinemsin.",
    theme: "treasure",
    imageFile: "love_14.jpeg"
  },
  {
    day: 15,
    message: "Ayın yarısı geçti, ama bizim aşkımız hiç yarılanmaz. Her gün daha bütün, daha mükemmel.",
    theme: "wholeness",
    imageFile: "love_15.jpeg"
  },
  {
    day: 16,
    message: "On altıncı gün de aynı gerçek: Sen benim dünyamın güneşisin, sen olmazsan hiçbir şey aydınlanmaz.",
    theme: "sunshine",
    imageFile: "love_16.jpeg"
  },
  {
    day: 17,
    message: "On yedinci gün, on yedinci dilek. Tüm dileklerimin ortak noktası sensin.",
    theme: "wishes",
    imageFile: "love_17.jpeg"
  },
  {
    day: 18,
    message: "On sekiz yaş gibi gençlik, on sekiz gün gibi tazelik. Seninle her gün ilk gün gibi heyecanlıyım.",
    theme: "youth",
    imageFile: "love_18.jpeg"
  },
  {
    day: 19,
    message: "On dokuzuncu gün da aynı aşk. Zaman geçiyor ama aşkımız hiç geçmiyor, aksine büyüyor.",
    theme: "growth",
    imageFile: "love_19.jpeg"
  },
  {
    day: 20,
    message: "Yirminci gün, yirmi tane 'seni seviyorum'. Her birini ayrı ayrı hissediyorum.",
    theme: "twenty_loves",
    imageFile: "love_20.jpeg"
  },
  {
    day: 21,
    message: "Yirmi birinci gün, yeni bir başlangıç. Her gün seninle yeni bir sayfa açıyoruz aşkımızın kitabında.",
    theme: "new_beginning",
    imageFile: "love_21.jpeg"
  }
];

export const getDailyLoveMessage = (): LoveMessage => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const cycleDay = (dayOfYear % 21) + 1; // 1-21 cycle
  
  return DAILY_LOVE_MESSAGES.find(msg => msg.day === cycleDay) || DAILY_LOVE_MESSAGES[0];
};

export const getLoveMessageForDay = (dayNumber: number): LoveMessage => {
  const cycleDay = ((dayNumber - 1) % 21) + 1;
  return DAILY_LOVE_MESSAGES.find(msg => msg.day === cycleDay) || DAILY_LOVE_MESSAGES[0];
};

export const getThemeColors = (theme: string): [string, string] => {
  const themeColors: Record<string, [string, string]> = {
    morning: ['from-rose-400', 'to-pink-300'], // Romantic morning
    time: ['from-purple-400', 'to-indigo-300'], // Time flow
    cosmic: ['from-indigo-500', 'to-purple-400'], // Deep space
    music: ['from-pink-400', 'to-rose-300'], // Musical passion
    journey: ['from-blue-400', 'to-cyan-300'], // Adventure
    weekend: ['from-emerald-400', 'to-teal-300'], // Fresh weekend
    eternal: ['from-violet-400', 'to-purple-300'], // Eternal love
    hope: ['from-sky-400', 'to-blue-300'], // Hopeful
    reasons: ['from-amber-400', 'to-orange-300'], // Warm reasons
    embrace: ['from-red-400', 'to-pink-300'], // Warm embrace
    excitement: ['from-fuchsia-400', 'to-pink-300'], // Exciting energy
    seasons: ['from-green-400', 'to-emerald-300'], // Seasonal change
    luck: ['from-lime-400', 'to-green-300'], // Lucky green
    treasure: ['from-yellow-400', 'to-amber-300'], // Golden treasure
    wholeness: ['from-purple-500', 'to-indigo-400'], // Complete
    sunshine: ['from-yellow-300', 'to-orange-300'], // Sunny
    wishes: ['from-violet-400', 'to-purple-300'], // Wishful
    youth: ['from-pink-400', 'to-rose-300'], // Youthful
    growth: ['from-green-500', 'to-emerald-400'], // Growing
    twenty_loves: ['from-rose-500', 'to-pink-400'], // Multiple loves
    new_beginning: ['from-indigo-500', 'to-purple-400'] // Fresh start
  };
  
  return themeColors[theme] || themeColors.cosmic;
};
