'use strict';
// Languages of the game. German is the base: THEMES and ASSETS in index.html stay German,
// the other languages translate them here (themes, motifs) together with all texts of the interface (ui).
// Serbian is written once in Latin script; the Cyrillic version is derived from it (toCyrillic).
// A missing text falls back to German. Placeholders: {name} is filled in by t().
const LANGUAGES = [
  {id:'de', name:'Deutsch', short:'DE', texts:'de', voices:['de']},
  {id:'en', name:'English', short:'EN', texts:'en', voices:['en']},
  {id:'sr-Latn', name:'Srpski (latinica)', short:'SR', texts:'sr', voices:['sr','hr','bs']},
  {id:'sr-Cyrl', name:'Српски (ћирилица)', short:'СР', texts:'sr', voices:['sr','hr','bs']}
];
// Region used to ask the device for a voice; any region of the language is accepted.
const VOICE_TAGS = {de:'de-DE', en:'en-GB', sr:'sr-RS', hr:'hr-HR', bs:'bs-BA'};

const LAT2CYR = {A:'А',B:'Б',C:'Ц',Č:'Ч',Ć:'Ћ',D:'Д',Đ:'Ђ',E:'Е',F:'Ф',G:'Г',H:'Х',I:'И',J:'Ј',K:'К',L:'Л',M:'М',N:'Н',O:'О',P:'П',R:'Р',S:'С',Š:'Ш',T:'Т',U:'У',V:'В',Z:'З',Ž:'Ж',
  Dž:'Џ',DŽ:'Џ',Lj:'Љ',LJ:'Љ',Nj:'Њ',NJ:'Њ'};
Object.keys(LAT2CYR).forEach(k=>{const lower=k.toLowerCase();if(!(lower in LAT2CYR))LAT2CYR[lower]=LAT2CYR[k].toLowerCase();});
const CYR2LAT = {};
Object.entries(LAT2CYR).forEach(([lat,cyr])=>{if(!(cyr in CYR2LAT)||lat.length===2&&lat[1]===lat[1].toLowerCase())CYR2LAT[cyr]=lat;});
// HTML tags, entities and placeholders are kept as they are.
const KEEP = /(<[^>]*>|&\w+;|\{\w+\})/;
function toCyrillic(text){
  const convert=part=>part.replace(/[Dd][žŽ]|[LlNn][jJ]|[A-Za-zČĆĐŠŽčćđšž]/g,ch=>LAT2CYR[ch]??ch);
  // Inside tags only aria-label is text for people.
  return String(text).split(KEEP).map((part,i)=>i%2?part.replace(/(aria-label=")([^"]*)/,(_,attr,value)=>attr+convert(value)):convert(part)).join('');
}
function toLatin(text){return String(text).split(KEEP).map((part,i)=>i%2?part:part.replace(/[Ѐ-ӿ]/g,ch=>CYR2LAT[ch]??ch)).join('');}

// Serbian letters with a word for each, in Latin script. The two scripts have different alphabetical orders.
const SR_WORDS = {A:'avion',B:'balon',C:'cvet',Č:'čokolada',Ć:'ćurka',D:'delfin',Dž:'džem',Đ:'đak',E:'ekran',F:'foka',G:'gitara',H:'helikopter',I:'igračka',J:'jabuka',K:'kuća',
  L:'lav',Lj:'ljuljaška',M:'mačka',N:'nos',Nj:'njuška',O:'ovca',P:'pas',R:'riba',S:'sunce',Š:'šešir',T:'tigar',U:'uvo',V:'voz',Z:'zec',Ž:'žaba'};
const SR_LATIN_ORDER = 'A B C Č Ć D Dž Đ E F G H I J K L Lj M N Nj O P R S Š T U V Z Ž'.split(' ');
const SR_CYRILLIC_ORDER = 'A B V G D Đ E Ž Z I J K L Lj M N Nj O P R S T Ć U F H C Č Dž Š'.split(' ');

const TEXTS = {
de: {
  // Letter, how it is spoken, word. Shown as "K wie Katze", spoken as "Ka wie Katze".
  letters: [['A','A','Affe'],['B','Be','Ball'],['C','Ze','Clown'],['D','De','Dino'],['E','E','Esel'],['F','Eff','Fisch'],['G','Ge','Giraffe'],['H','Ha','Hund'],['I','I','Igel'],
    ['J','Jott','Jacke'],['K','Ka','Katze'],['L','Ell','Löwe'],['M','Emm','Maus'],['N','Enn','Nase'],['O','O','Ohr'],['P','Pe','Pinguin'],['Q','Ku','Qualle'],['R','Err','Rakete'],
    ['S','Ess','Sonne'],['T','Te','Tiger'],['U','U','Uhu'],['V','Vau','Vogel'],['W','We','Wal'],['X','Ix','Xylophon'],['Y','Ypsilon','Yeti']],
  ui: {
    pageTitle:'{app} · Kleine Teile, große Abenteuer', language:'Sprache',
    homeAria:'Zur Motivauswahl', brandNote:'Kleine Teile · große Abenteuer',
    starsPillTitle:'Für jedes fertige Motiv pro Schwierigkeitsstufe gibt es einen Stern', starsCollected:'gesammelte Sterne',
    soundOn:'Ton an', soundOff:'Ton aus', soundTurnOff:'Ton ausschalten', soundTurnOn:'Ton einschalten',
    themesAria:'Welt auswählen', welcomeLine:'Ein Teil nach dem anderen.',
    heroCount:'{n} gezeichnete Abenteuer', tagPieces:'4 bis 25 Puzzleteile', tagOffline:'Ohne Internet spielbar', playVideo:'Video abspielen',
    resumeTitle:'Dein Abenteuer wartet auf dich.', resumeBtn:'Weiterspielen', resumeText:'{title} · {placed} von {total} Teilen geschafft',
    installHtml:'<strong>Als App auf den Home-Bildschirm</strong>In Safari auf <span class="share-glyph" aria-label="Teilen">⬆︎</span> „Teilen“ tippen und „Zum Home-Bildschirm“ wählen. Danach startet das Puzzle im Vollbild und funktioniert auch ohne Internet.',
    installClose:'Hinweis ausblenden',
    chooseTitle:'Welches Abenteuer darf es sein?', chooseText:'Wähle zuerst die Teilezahl, dann dein Lieblingsbild.',
    levelsAria:'Anzahl der Puzzleteile', level2:'GANZ LEICHT', level3:'LEICHT', level4:'KNOBELN', level5:'PROFI',
    learnTitle:'Zeichen im Puzzle', learnText:'Zahlen, Buchstaben oder Würfelpunkte auf den Plätzen. Mit Ton werden sie vorgelesen.',
    modesAria:'Zeichen auf den Plätzen im Puzzle', modeNumbers:'ZAHLEN', modeLetters:'BUCHSTABEN', modeDice:'WÜRFEL', modeOff:'OHNE',
    pieceLabelsOn:'Zeichen auf den Teilen: an', pieceLabelsOff:'Zeichen auf den Teilen: aus',
    modeNote:'Würfelpunkte gibt es bis 9 Teile. Bei mehr Teilen stehen Zahlen im Bild.',
    worldAria:'Welt {title}, {stars} von {total} Sternen',
    routeHeading:'Deine Schatzkarte', routeTitle:'Deine Schatzkarte · {n} Teile',
    routeOpen:'Geschafft! Die Schatztruhe für {n} Teile ist offen.',
    routeLeft:v=>`Noch ${v.left} ${v.left===1?'Bild':'Bilder'} bis zur Schatztruhe. Jede Teilezahl hat ihre eigene Truhe.`,
    routeChestsTitle:'{chests} von {total} Schatztruhen in dieser Welt geöffnet',
    stationAria:'Station {position}: {title}, {state}. Puzzle mit {n} Teilen starten.', stationDone:'geschafft', stationNext:'nächster Halt', stationOpen:'noch offen',
    chestOpen:'Schatztruhe geöffnet', chestClosed:'Schatztruhe, noch verschlossen',
    motifAria:'{title}: Puzzle mit {n} Teilen starten. {earned} von 4 Sternen.', motifBadge:'ABENTEUER {number}', motifAction:'Los geht’s', starsAria:'{earned} von 4 Sternen',
    howtoHtml:'<strong>So einfach geht’s</strong>Zieh ein Puzzleteil in das Bild. Oder tippe zuerst auf ein Teil und dann auf seinen Platz. Die Bildhilfe und ein kleiner Tipp helfen dir weiter – ganz ohne Zeitlimit. Tippst du auf einen freien Platz, verrät er dir sein Zeichen.',
    footerHtml:'Mit Fantasie gezeichnet. Für kleine Weltraumfans gebaut. · <a href="datenschutz.html">Datenschutz</a>',
    storageNote:'Offline · Keine Werbung · Keine Datenübertragung', storageSession:'Offline · Keine Datenübertragung · Fortschritt nur in dieser Sitzung',
    backAria:'Zurück zur Motivauswahl', gameSubtitle:'{n} Teile · Du schaffst das!', time:'Zeit', moves:'Züge',
    boardTitle:'Hier entsteht dein Bild', helpOn:'Bildhilfe an', helpOff:'Bildhilfe aus', slotsAria:'Plätze für die Puzzleteile',
    progressAria:'Puzzle-Fortschritt', progressLabel:'{count} / {total} Teile',
    hint:'Kleiner Tipp', preview:'Bild anschauen', restart:'Neu starten', trayTitle:'Deine Puzzleteile', shuffle:'Mischen',
    trayIntroHtml:'Teil auswählen, dann den Platz im Bild antippen.<br>Oder einfach hineinziehen.', trayAria:'Noch freie Puzzleteile',
    letterShow:'{letter} wie {word}', letterSay:'{name} wie {word}', dots:v=>v.n===1?'1 Punkt':`${v.n} Punkte`,
    slotAria:'Platz {label}, Reihe {row}, Spalte {col}', slotPlaced:', bereits eingesetzt',
    preparing:'Deine Puzzleteile werden vorbereitet …', welcomeBack:'Willkommen zurück! Dein Abenteuer geht weiter.', startHint:'Wähle ein Teil. Dein Abenteuer beginnt!',
    loadError:'Das Puzzle konnte nicht geladen werden. Öffne die Datei bitte in einem aktuellen Browser.',
    pieceAria:'Puzzleteil {number} auswählen', pieceAriaLabel:'Puzzleteil {number} mit Zeichen {label} auswählen', pieceTitle:'Antippen oder ins Bild ziehen',
    trayDoneTitle:'Alles am richtigen Platz!', trayDoneText:'Dein Bild ist fertig. Das hast du richtig gut gemacht.',
    trayLeft:'Deine Puzzleteile · noch {n}', trayComplete:'Dein Abenteuer ist komplett',
    chooseOther:'Wähle ein anderes Teil. Lass dir ruhig Zeit.', pieceSelected:'Teil ausgewählt. Tippe auf seinen Platz im Bild.',
    dragSelected:'Teil ausgewählt. Zieh es ins Bild oder tippe auf seinen Platz.',
    slotInfo:'Das ist {label}. Tippe jetzt auf ein Puzzleteil.', tapPieceFirst:'Tippe zuerst auf eines der freien Puzzleteile.',
    praise:['Super, das passt!','Ein Stück näher an den Sternen!','Wunderbar eingesetzt!','Genau richtig. Weiter so!','Dein Bild wird immer schöner!'],
    wrong:'Fast! Probier einen anderen Platz. Schau auf die Farben und die Form.',
    hintText:'Der leuchtende Platz gehört zu deinem ausgewählten Teil. Probier’s aus!', hintTextLabel:'Der leuchtende Platz {label} gehört zu deinem ausgewählten Teil. Probier’s aus!',
    shuffled:'Neu gemischt. Vielleicht entdeckst du jetzt das nächste Teil!',
    previewTitle:'Dein fertiges Bild', closePreview:'Bildvorschau schließen', previewNote:'Schau auf die Farben, die Ecken und die Formen. Beim Anschauen macht die Uhr Pause.', continue:'Weiterpuzzeln',
    restartTitle:'Eine neue Runde?', cancel:'Abbrechen', restartNote:'Dieses Puzzle wird neu gemischt. Die bereits eingesetzten Teile dieser Runde werden zurückgelegt. Deine gesammelten Sterne bleiben erhalten.', confirmRestart:'Ja, neu starten',
    closeWin:'Fertiges Puzzle anschauen', winEyebrow:'Mission geschafft', winTitle:'Sternenstark!', treasureFound:'Schatz gefunden!',
    winText:'{title} ist komplett. Du hast alle Teile an ihren Platz gebracht!', winPieces:'Puzzleteile', winTime:'Spielzeit',
    winChest:'Die Schatztruhe ist offen! Alle {world}-Bilder mit {n} Teilen geschafft.', winNewStar:'Ein neuer Stern für deine Sammlung!', winAgain:'Dieses Abenteuer hast du wieder wunderbar geschafft!',
    winStatus:'Sternenstark! Dein Puzzle ist fertig.', winHome:'Alle Abenteuer', nextPuzzle:'Nächstes Abenteuer',
    worldLockedAria:'{title}: gesperrt. Für Eltern: alle Welten freischalten', worldLocked:'Freischalten',
    unlockTitle:'Alle Welten freischalten', gateNote:'Für Eltern: Bitte löse die Aufgabe, um weiterzumachen.', gateQuestion:'Wie viel ist {a} × {b}?',
    gateWrong:'Das stimmt leider nicht. Neue Aufgabe:', gateContinue:'Weiter',
    unlockNote:'{worlds} weitere Welten mit {pictures} Bildern. Einmal kaufen und für immer spielen, auf allen Geräten mit deinem Konto. Kein Abo, keine Werbung.',
    buy:'Kaufen für {price}', buyNoPrice:'Kaufen', restore:'Käufe wiederherstellen', unlockWorking:'Einen Moment …',
    unlockDone:'Danke! Alle Welten sind freigeschaltet.', unlockFailed:'Der Kauf wurde nicht abgeschlossen.', unlockUnavailable:'Der Store ist gerade nicht erreichbar. Bitte später noch einmal versuchen.',
    restoreNone:'Es wurde kein Kauf gefunden.',
    demoTitle:'Probierversion', demoText:'Hier kannst du die Welt Weltraum spielen. Alle Welten gibt es in der App.', storePlay:'Bei Google Play', storeApple:'Im App Store'
  }
},
en: {
  letters: 'Apple Ball Cat Dog Egg Fish Giraffe Hat Igloo Jellyfish Kite Lion Moon Nest Owl Penguin Queen Rocket Sun Tiger Umbrella Van Whale Xylophone Yo-yo'.split(' ').map(word=>[word[0],word[0],word.toLowerCase()]),
  ui: {
    pageTitle:'{app} · Little pieces, big adventures', language:'Language',
    homeAria:'Back to the pictures', brandNote:'Little pieces · big adventures',
    starsPillTitle:'You get a star for every finished picture at every level', starsCollected:'stars collected',
    soundOn:'Sound on', soundOff:'Sound off', soundTurnOff:'Turn sound off', soundTurnOn:'Turn sound on',
    themesAria:'Choose a world', welcomeLine:'One piece at a time.',
    heroCount:'{n} hand-drawn adventures', tagPieces:'4 to 25 puzzle pieces', tagOffline:'Plays without internet', playVideo:'Play video',
    resumeTitle:'Your adventure is waiting for you.', resumeBtn:'Keep playing', resumeText:'{title} · {placed} of {total} pieces done',
    installHtml:'<strong>Add it to your Home Screen</strong>In Safari, tap <span class="share-glyph" aria-label="Share">⬆︎</span> “Share” and choose “Add to Home Screen”. The puzzle then opens full screen and works without internet too.',
    installClose:'Hide tip',
    chooseTitle:'Which adventure will it be?', chooseText:'First pick the number of pieces, then your favourite picture.',
    levelsAria:'Number of puzzle pieces', level2:'SUPER EASY', level3:'EASY', level4:'TRICKY', level5:'PRO',
    learnTitle:'Signs in the puzzle', learnText:'Numbers, letters or dice dots on the spaces. With sound on, they are read aloud.',
    modesAria:'Signs on the spaces in the puzzle', modeNumbers:'NUMBERS', modeLetters:'LETTERS', modeDice:'DICE', modeOff:'NONE',
    pieceLabelsOn:'Signs on the pieces: on', pieceLabelsOff:'Signs on the pieces: off',
    modeNote:'Dice dots go up to 9 pieces. With more pieces, the picture shows numbers.',
    worldAria:'World {title}, {stars} of {total} stars',
    routeHeading:'Your treasure map', routeTitle:'Your treasure map · {n} pieces',
    routeOpen:'You did it! The treasure chest for {n} pieces is open.',
    routeLeft:v=>`${v.left} more ${v.left===1?'picture':'pictures'} to the treasure chest. Every number of pieces has its own chest.`,
    routeChestsTitle:'{chests} of {total} treasure chests opened in this world',
    stationAria:'Stop {position}: {title}, {state}. Start the puzzle with {n} pieces.', stationDone:'done', stationNext:'next stop', stationOpen:'still to do',
    chestOpen:'Treasure chest open', chestClosed:'Treasure chest, still locked',
    motifAria:'{title}: start the puzzle with {n} pieces. {earned} of 4 stars.', motifBadge:'ADVENTURE {number}', motifAction:'Let’s go', starsAria:'{earned} of 4 stars',
    howtoHtml:'<strong>It’s this easy</strong>Drag a puzzle piece into the picture. Or tap a piece first and then its space. The picture helper and a little tip help you along – there is no time limit. Tap an empty space and it tells you its sign.',
    footerHtml:'Drawn with imagination. Made for little space fans. · <a href="datenschutz.html">Privacy</a>',
    storageNote:'Offline · No ads · No data sent', storageSession:'Offline · No data sent · Progress only kept in this session',
    backAria:'Back to the pictures', gameSubtitle:'{n} pieces · You can do it!', time:'Time', moves:'Moves',
    boardTitle:'Your picture grows here', helpOn:'Picture helper on', helpOff:'Picture helper off', slotsAria:'Spaces for the puzzle pieces',
    progressAria:'Puzzle progress', progressLabel:'{count} / {total} pieces',
    hint:'Little tip', preview:'Look at picture', restart:'Start again', trayTitle:'Your puzzle pieces', shuffle:'Shuffle',
    trayIntroHtml:'Pick a piece, then tap its space in the picture.<br>Or just drag it in.', trayAria:'Puzzle pieces still free',
    letterShow:'{letter} for {word}', letterSay:'{letter} for {word}', dots:v=>v.n===1?'1 dot':`${v.n} dots`,
    slotAria:'Space {label}, row {row}, column {col}', slotPlaced:', already placed',
    preparing:'Getting your puzzle pieces ready …', welcomeBack:'Welcome back! Your adventure continues.', startHint:'Pick a piece. Your adventure begins!',
    loadError:'The puzzle could not be loaded. Please open it in an up-to-date browser.',
    pieceAria:'Pick puzzle piece {number}', pieceAriaLabel:'Pick puzzle piece {number} with sign {label}', pieceTitle:'Tap or drag into the picture',
    trayDoneTitle:'Everything is in its place!', trayDoneText:'Your picture is finished. You did a really great job.',
    trayLeft:'Your puzzle pieces · {n} left', trayComplete:'Your adventure is complete',
    chooseOther:'Pick another piece. Take your time.', pieceSelected:'Piece picked. Tap its space in the picture.',
    dragSelected:'Piece picked. Drag it into the picture or tap its space.',
    slotInfo:'This is {label}. Now tap a puzzle piece.', tapPieceFirst:'First tap one of the free puzzle pieces.',
    praise:['Super, that fits!','One step closer to the stars!','Wonderfully placed!','Just right. Keep going!','Your picture is getting prettier and prettier!'],
    wrong:'Almost! Try another space. Look at the colours and the shape.',
    hintText:'The glowing space belongs to your piece. Give it a try!', hintTextLabel:'The glowing space {label} belongs to your piece. Give it a try!',
    shuffled:'All shuffled. Maybe you’ll spot the next piece now!',
    previewTitle:'Your finished picture', closePreview:'Close picture preview', previewNote:'Look at the colours, the corners and the shapes. The clock takes a break while you look.', continue:'Keep puzzling',
    restartTitle:'A new round?', cancel:'Cancel', restartNote:'This puzzle gets shuffled again. The pieces you placed in this round go back. The stars you collected stay yours.', confirmRestart:'Yes, start again',
    closeWin:'Look at the finished puzzle', winEyebrow:'Mission complete', winTitle:'Star power!', treasureFound:'Treasure found!',
    winText:'{title} is complete. You put every piece in its place!', winPieces:'Puzzle pieces', winTime:'Playing time',
    winChest:'The treasure chest is open! All {world} pictures done with {n} pieces.', winNewStar:'A new star for your collection!', winAgain:'You did this adventure wonderfully again!',
    winStatus:'Star power! Your puzzle is finished.', winHome:'All adventures', nextPuzzle:'Next adventure',
    worldLockedAria:'{title}: locked. For parents: unlock all worlds', worldLocked:'Unlock',
    unlockTitle:'Unlock all worlds', gateNote:'For parents: please solve this to continue.', gateQuestion:'What is {a} × {b}?',
    gateWrong:'That is not right. New question:', gateContinue:'Continue',
    unlockNote:'{worlds} more worlds with {pictures} pictures. Buy once and play forever, on all devices with your account. No subscription, no ads.',
    buy:'Buy for {price}', buyNoPrice:'Buy', restore:'Restore purchases', unlockWorking:'One moment …',
    unlockDone:'Thank you! All worlds are unlocked.', unlockFailed:'The purchase was not completed.', unlockUnavailable:'The store cannot be reached right now. Please try again later.',
    restoreNone:'No purchase was found.',
    demoTitle:'Trial version', demoText:'Here you can play the Space world. All worlds are in the app.', storePlay:'On Google Play', storeApple:'On the App Store'
  },
  themes: {
    weltraum:{title:'Space', eyebrow:'Your little space mission', highlight:'Up to the stars.', text:'Rockets, the moon bunny and new friends are waiting for you. Pick a picture and put together your very own space adventure.'},
    dinos:{title:'Dinos', eyebrow:'Your little dino expedition', highlight:'Back to dino times.', text:'Dino babies, long-necks and a friendly T. rex are waiting for you. Pick a picture and puzzle your way back to prehistoric times.'},
    hunde:{title:'Rescue Dogs', eyebrow:'Your little rescue mission', highlight:'No job is too small.', text:'Five brave puppies help wherever they can. Pick a picture and join the big rescue mission.'},
    eis:{title:'Ice Magic', eyebrow:'Your little winter adventure', highlight:'Glitter, snow and magic.', text:'A little snow princess, a funny snowman and cuddly polar animals are waiting for you. Pick a picture and puzzle your way into the winter magic.'},
    piraten:{title:'Pirates', eyebrow:'Your little treasure hunt', highlight:'Ahoy, off to Treasure Island!', text:'A brave pirate crew, a cheeky parrot and a friendly octopus are waiting for you. Pick a picture and sail along to the big treasure.'},
    helden:{title:'Superheroes', eyebrow:'Your little hero mission', highlight:'Little heroes, big powers.', text:'Blitz, Stella, Mio the cat and Robo the robot help all over town. Pick a picture and join in the next heroic deed.'}
  },
  // Title, short description, image description for screen readers.
  motifs: {
    '01_raketenstart':['Lift-off','3, 2, 1 – off to the stars!','A pink rocket with a smiling child takes off above a colourful landscape with clouds and stars.'],
    '02_mondhaeschen':['The Moon Bunny','One small step, one big adventure.','A bunny in a space suit waves on the moon. Next to it stands a star flag, and the Earth shines in the sky.'],
    '03_ringplanet':['Around Saturn','The cat rocket discovers colourful rings.','A mint-green cat rocket flies in front of a big pastel ringed planet and a little robot.'],
    '04_weltraumfreunde':['Space Friends','Hello, little alien! Nice to meet you.','A child in a space suit and a friendly green alien meet among colourful mushrooms. A UFO floats above them.'],
    '05_raketenrennen':['The Rocket Race','Two rockets zoom through a shower of stars.','A pink and a mint-green rocket fly with colourful rainbow trails through a sky full of stars.'],
    '06_sternenpost':['Mail for the Space Station','A delivery full of shining stars.','A cosy space station with a cat pilot and a child receives a little rocket. A half moon and a mail robot keep them company.'],
    '07_dino_ei':['Hello, Little Dino!','Crack! Who is hatching from the egg?','A little green dino hatches from a spotted egg in a cosy nest, surrounded by ferns, flowers and a friendly volcano in the distance.'],
    '08_langhals_see':['At the Evening Lake','Mama long-neck and her baby enjoy the sunset.','A big turquoise long-necked dino stands with its baby in a shallow lake while the sun sets between palm trees and mountains.'],
    '09_trex_geburtstag':['Dino Birthday','Hooray! The little T. rex has a birthday today.','A happy orange T. rex in a party hat stands in front of a colourful cake with candles, surrounded by balloons, bunting, presents and a little dino friend.'],
    '10_flugsaurier':['Flying over the Sea','Whee! Two pterosaurs fly under the rainbow.','Two happy pterosaurs in pink and light blue fly over the turquoise sea with a little palm island, with a rainbow, clouds and a laughing sun above.'],
    '11_triceratops_dschungel':['In the Jungle','The little triceratops discovers flowers and butterflies.','A light blue triceratops with a pink neck frill and three horns stands smiling among big jungle leaves, colourful blossoms, vines and butterflies.'],
    '12_regenbogen_vulkan':['The Rainbow Volcano','Puff, puff! The volcano blows little hearts and a rainbow.','A smiling purple volcano blows colourful heart-shaped clouds and a rainbow into the sky, while a green stegosaurus with pink back plates and a little yellow dino watch happily.'],
    '13_feuerwehr_corgi':['Help for the Kitten','The firefighter corgi gets the kitten safely down from the tree.','A corgi in a red fire helmet stands in the basket of a fire ladder and helps a happy kitten down from an apple tree while the mother cat waits below.'],
    '14_beagle_streife':['Ducks on the Zebra Crossing','The police beagle stops the traffic so the ducks can cross the road safely.','A beagle in a blue police cap sits in its police car and holds up a stop sign while a mother duck with three ducklings waddles over the zebra crossing to the pond.'],
    '15_mops_hubschrauber':['Teddy Flies Home','The helicopter pug brings the bunny its lost teddy.','A pug in flying goggles flies a mint-green helicopter over green hills and lowers a teddy in a little basket on a rope to a cheering bunny.'],
    '16_dackel_baustelle':['The Dachshund Builds a Bridge','With its digger, the dachshund helps build a little bridge.','A dachshund in an orange hard hat sits in an orange digger shovelling sand, while a crane brings a plank to the new wooden bridge over the stream and traffic cones guard the building site.'],
    '17_rettungsboot':['A Lifebuoy for the Little Seal','The fluffy water puppy throws the little seal a lifebuoy.','A white, fluffy puppy in a turquoise life jacket stands in a turquoise lifeboat and throws a lifebuoy to a happily waving little seal in the waves.'],
    '18_hunde_team':['The Rescue Dog Team','All five rescue puppies wave in front of their lighthouse at sunset.','Five happy rescue puppies – corgi, beagle, pug, dachshund and a white spitz – stand waving in front of their striped lighthouse with a dog house while the sun sinks into the sea.'],
    '19_eispalast':['The Sparkling Ice Palace','The little snow princess makes snowflakes in front of her palace.','A little princess with dark curls, two hair buns and a lilac winter dress conjures glittering snowflakes from her hands; behind her an ice palace shines under colourful northern lights, and penguins and a snow hare watch.'],
    '20_schneemann':['Let’s Build a Snowman','The princess and the little polar bear build a happy snowman.','The little snow princess and a polar bear cub with a scarf build a round snowman with a pink bobble hat and knitted scarf, while big flakes fall on snowy fir trees and a cosy wooden cabin.'],
    '21_schlittschuh_see':['Skating on the Lake','Whee! The princess skates in circles with the penguins.','The little snow princess skates across a frozen lake leaving glittering tracks in the ice; three penguins in scarves and earmuffs zip around her, and a little seal watches from a hole in the ice.'],
    '22_schlittenfahrt':['Hooray, Sledging!','With the snow hare and the arctic fox, the princess zooms down the hill.','The little snow princess sits with a snow hare and a blue-grey arctic fox in a red sledge and zooms cheering down a snowy hill; the snow flies up behind them and a little polar bear waves at the bottom.'],
    '23_polarlicht_nacht':['Cocoa under the Northern Lights','Snug and warm, everyone watches the northern lights and shooting stars.','The little snow princess and a polar bear cub sit snuggled under a checked blanket, drinking hot cocoa and watching colourful northern lights and shooting stars, next to a glowing igloo with fairy lights and a snowy owl on top.'],
    '24_eiskristall_garten':['Dancing in the Ice Crystal Garden','The snowy owl flies along when the princess dances in the glitter garden.','The little snow princess dances with raised arms in a glittering garden of colourful ice crystals and ice roses under an arch of ice; big snowflakes swirl around her, a snowy owl flies in with spread wings, and a snow hare and a penguin dance along.'],
    '25_piratenschiff':['Cast Off, Little Pirates!','The little captain and his crew sail out to sea on the star ship.','A wooden ship with cream sails and a flag with a laughing star sails over sparkling waves; at the front the little captain in a tricorn hat looks through a telescope, the navigator waves at the back, the ship’s cat sits in the crow’s nest and a colourful parrot flies along while dolphins jump beside the ship.'],
    '26_schatzkarte':['The Secret Treasure Map','Where is the treasure hidden? The parrot points to the red X.','On deck, the little captain and the navigator with a compass lean over a big treasure map with an island, a dotted path and a red X, which a colourful parrot points to with its wing, while the ship’s cat sits on a barrel and Treasure Island can be seen in the distance.'],
    '27_schatzinsel':['Land Ahoy: Treasure Island','Here is the X! The little captain reaches for the shovel.','On the palm beach of an island, the little captain stands with his shovel at a big X in the sand; the navigator holds the treasure map, the ship’s cat waves, a crab watches and the parrot sits in the palm tree, while the rowing boat lies on the shore and the star ship waits at anchor.'],
    '28_schatztruhe':['The Sparkling Treasure','In the cave, the treasure chest full of gold and jewels is glowing.','In a purple glittering cave with colourful crystals stands an open, glowing treasure chest full of gold coins, jewels, pearls and a little crown; the little captain and the navigator cheer with raised arms, the parrot wears a pearl necklace and the ship’s cat is happy with a coin.'],
    '29_flaschenpost':['A Message from the Whale','A friendly whale brings the little pirates a message in a bottle.','A big, smiling blue whale balances a bottle with a letter inside on its water spout, and the little captain stretches out for it from the bow of the star ship, while the navigator waves, the ship’s cat watches, the parrot flies over and a baby whale swims along.'],
    '30_kraken_freund':['Up High with Kuno the Octopus','The friendly giant octopus lifts the little pirates into the air at sunset.','In a lagoon in the pink and orange sunset, a big, laughing pink octopus gently lifts the little captain and the navigator up with its arms; the parrot sits on its head and the ship’s cat waves from the rowing boat while fish jump all around.'],
    '31_heldenteam':['The Superhero Team','Blitz, Stella, Mio the cat and Robo are ready – at sunset above the city.','Four little superheroes – a boy with a lightning bolt on his suit, a flying girl with a star, a cat with a purple mask and a little robot – wave happily from a rooftop, with the city glowing in the sunset behind them.'],
    '32_flug_ueber_stadt':['Stella Brings the Balloons','Flying Stella brings the runaway balloons back to the park party.','A superhero girl in a star suit and a mint-green cape flies over the rooftops of the city with a colourful bunch of balloons, while the little robot flies behind her and two animal children cheer in the park.'],
    '33_drachen_rettung':['Mio the Cat Rescues the Kite','Mio the cat climbs up the wall and gets the kite down from the roof.','An orange cat with a purple mask and a superhero suit climbs up a tall house and reaches for the tail of a colourful kite caught on the roof aerial, while a bear child and the lightning boy look up eagerly from below.'],
    '34_blitz_lieferung':['Blitz Brings the Cake','Speedy Blitz zooms to the garden party with the birthday cake.','A superhero boy with a lightning bolt on his turquoise suit races along a glowing trail across the meadow, balancing a birthday cake with candles on his hand, while a bunny in a party hat, a fox child and the little robot with a present cheer at the garden fence.'],
    '35_heldenquartier':['The Tree House Headquarters','The heroes rest in their cosy tree house – and Robo waters the flowers.','A cosy tree house with a star flag and fairy lights sits in a big tree top: Stella waves from the round window, Mio the cat sits on a branch, Blitz whizzes down the slide and the little robot waters the flowers below.'],
    '36_sternennacht':['Good Night, Little Town','On their evening round, the heroes light the lanterns and hang up stars.','Above the sleeping town, Stella carries a shining star into the sky, Robo glows like a night light, Mio the cat sits on the roof with a lantern and Blitz zooms along the street making the street lamps light up, while a fox child in a nightcap waves from the window.'],
    '37_riesenrakete':['The Giant Rocket','What a big rocket! And right at the top, the little pilot sits in the window.','A huge white rocket with a red nose stands ready for launch next to the tower. In the big round window sits a little boy with brown hair and brown eyes, waving. Down below, a bunny and a bear cub wave too, looking tiny next to the rocket.'],
    '38_sternenflitzer':['All Aboard!','The little pilot climbs into the star glider, and Piep the robot beeps with joy.','A boy with brown hair in an orange flight suit climbs a ladder to the open cockpit of a white star glider with blue wings, turns round, smiles and waves. In front of it, Piep, the little round robot with a pink dome head, waves too. A big planet and lots of stars shine in the sky.'],
    '39_wuestenplanet':['Flight over the Desert Planet','Two suns, lots of sand and a hello to the little desert foxes.','The star glider flies with its engine glowing over a desert planet with two suns, sand dunes, rock arches and round dome houses. The boy with brown hair waves from the cockpit, Piep the robot peeks out of his hatch behind him, and down on a dune a little desert fox waves back.']
  }
},
sr: {
  ui: {
    pageTitle:'{app} · Mali delići, velike avanture', language:'Jezik',
    homeAria:'Nazad na izbor slika', brandNote:'Mali delići · velike avanture',
    starsPillTitle:'Za svaku složenu sliku na svakom nivou dobijaš zvezdicu', starsCollected:'sakupljene zvezdice',
    soundOn:'Zvuk uključen', soundOff:'Zvuk isključen', soundTurnOff:'Isključi zvuk', soundTurnOn:'Uključi zvuk',
    themesAria:'Izaberi svet', welcomeLine:'Delić po delić.',
    heroCount:'{n} nacrtanih avantura', tagPieces:'Od 4 do 25 delića', tagOffline:'Igra se i bez interneta', playVideo:'Pusti video',
    resumeTitle:'Tvoja avantura te čeka.', resumeBtn:'Nastavi', resumeText:'{title} · složeno {placed} od {total} delića',
    installHtml:'<strong>Kao aplikacija na početnom ekranu</strong>U Safariju dodirni <span class="share-glyph" aria-label="Deli">⬆︎</span> „Deli“ i izaberi „Dodaj na početni ekran“. Posle toga se slagalica otvara preko celog ekrana i radi i bez interneta.',
    installClose:'Sakrij savet',
    chooseTitle:'Koju avanturu biraš?', chooseText:'Prvo izaberi broj delića, a onda svoju omiljenu sliku.',
    levelsAria:'Broj delića slagalice', level2:'SASVIM LAKO', level3:'LAKO', level4:'MOZGALICA', level5:'MAJSTOR',
    learnTitle:'Znakovi u slagalici', learnText:'Brojevi, slova ili tačkice kao na kockici stoje na mestima. Kad je zvuk uključen, čitaju se naglas.',
    modesAria:'Znakovi na mestima u slagalici', modeNumbers:'BROJEVI', modeLetters:'SLOVA', modeDice:'KOCKICA', modeOff:'BEZ',
    pieceLabelsOn:'Znakovi na delićima: uključeno', pieceLabelsOff:'Znakovi na delićima: isključeno',
    modeNote:'Tačkice kao na kockici postoje do 9 delića. Kad ima više delića, na slici stoje brojevi.',
    worldAria:'Svet {title}, {stars} od {total} zvezdica',
    routeHeading:'Tvoja mapa blaga', routeTitle:'Tvoja mapa blaga · {n} delića',
    routeOpen:'Bravo! Kovčeg s blagom za {n} delića je otvoren.',
    routeLeft:v=>`Još ${v.left} ${plural(v.left,{one:'slika',few:'slike',other:'slika'})} do kovčega s blagom. Svaki broj delića ima svoj kovčeg.`,
    routeChestsTitle:'Otvoreni kovčezi s blagom u ovom svetu: {chests} od {total}',
    stationAria:'Stanica {position}: {title}, {state}. Pokreni slagalicu sa {n} delića.', stationDone:'gotovo', stationNext:'sledeća stanica', stationOpen:'još nije složeno',
    chestOpen:'Kovčeg s blagom je otvoren', chestClosed:'Kovčeg s blagom, još je zaključan',
    motifAria:'{title}: pokreni slagalicu sa {n} delića. {earned} od 4 zvezdice.', motifBadge:'AVANTURA {number}', motifAction:'Kreni', starsAria:'{earned} od 4 zvezdice',
    howtoHtml:'<strong>Ovako je lako</strong>Prevuci delić u sliku. Ili prvo dodirni delić, a onda njegovo mesto. Pomoćna slika i mali savet pomažu ti dalje – bez ikakve žurbe. Kad dodirneš slobodno mesto, ono ti otkrije svoj znak.',
    footerHtml:'Nacrtano s maštom. Napravljeno za male ljubitelje svemira. · <a href="datenschutz.html">Privatnost</a>',
    storageNote:'Oflajn · Bez reklama · Bez slanja podataka', storageSession:'Oflajn · Bez slanja podataka · Napredak se čuva samo dok je igra otvorena',
    backAria:'Nazad na izbor slika', gameSubtitle:'{n} delića · Možeš ti to!', time:'Vreme', moves:'Potezi',
    boardTitle:'Ovde nastaje tvoja slika', helpOn:'Pomoć uključena', helpOff:'Pomoć isključena', slotsAria:'Mesta za deliće slagalice',
    progressAria:'Napredak slagalice', progressLabel:'{count} / {total} delića',
    hint:'Mali savet', preview:'Pogledaj sliku', restart:'Ispočetka', trayTitle:'Tvoji delići', shuffle:'Promešaj',
    trayIntroHtml:'Izaberi delić, a onda dodirni njegovo mesto na slici.<br>Ili ga samo prevuci.', trayAria:'Slobodni delići slagalice',
    letterShow:'{letter} kao {word}', letterSay:'{letter} kao {word}', dots:v=>`${v.n} ${plural(v.n,{one:'tačka',few:'tačke',other:'tačaka'})}`,
    slotAria:'Mesto {label}, red {row}, kolona {col}', slotPlaced:', već je postavljeno',
    preparing:'Pripremamo tvoje deliće …', welcomeBack:'Opet si tu! Tvoja avantura se nastavlja.', startHint:'Izaberi jedan delić. Tvoja avantura počinje!',
    loadError:'Slagalica nije mogla da se učita. Otvori je u novijem pregledaču.',
    pieceAria:'Izaberi delić {number}', pieceAriaLabel:'Izaberi delić {number} sa znakom {label}', pieceTitle:'Dodirni ili prevuci u sliku',
    trayDoneTitle:'Sve je na svom mestu!', trayDoneText:'Tvoja slika je gotova. Baš lepo urađeno!',
    trayLeft:'Tvoji delići · još {n}', trayComplete:'Tvoja avantura je gotova',
    chooseOther:'Izaberi neki drugi delić. Polako, imaš vremena.', pieceSelected:'Delić je izabran. Dodirni njegovo mesto na slici.',
    dragSelected:'Delić je izabran. Prevuci ga u sliku ili dodirni njegovo mesto.',
    slotInfo:'Ovo je {label}. Sada dodirni jedan delić.', tapPieceFirst:'Prvo dodirni jedan od slobodnih delića.',
    praise:['Super, to je to!','Još malo bliže zvezdama!','Divno postavljeno!','Tačno tako. Samo napred!','Tvoja slika je sve lepša!'],
    wrong:'Skoro! Probaj neko drugo mesto. Pogledaj boje i oblik.',
    hintText:'Mesto koje svetli pripada tvom deliću. Probaj!', hintTextLabel:'Mesto {label} koje svetli pripada tvom deliću. Probaj!',
    shuffled:'Promešano. Možda sada pronađeš sledeći delić!',
    previewTitle:'Tvoja gotova slika', closePreview:'Zatvori sliku', previewNote:'Pogledaj boje, uglove i oblike. Dok gledaš, sat se odmara.', continue:'Nastavi slaganje',
    restartTitle:'Nova runda?', cancel:'Otkaži', restartNote:'Ova slagalica se ponovo meša. Delići koji su već postavljeni u ovoj rundi vraćaju se nazad. Tvoje sakupljene zvezdice ostaju.', confirmRestart:'Da, ispočetka',
    closeWin:'Pogledaj gotovu slagalicu', winEyebrow:'Misija uspela', winTitle:'Bravo, zvezdo!', treasureFound:'Blago je pronađeno!',
    winText:'Slika „{title}“ je gotova. Svi delići su na svom mestu!', winPieces:'Delića', winTime:'Vreme igre',
    winChest:'Kovčeg s blagom je otvoren! Sve slike iz sveta „{world}“ sa {n} delića su složene.', winNewStar:'Nova zvezdica za tvoju zbirku!', winAgain:'I ova avantura je opet divno složena!',
    winStatus:'Bravo, zvezdo! Tvoja slagalica je gotova.', winHome:'Sve avanture', nextPuzzle:'Sledeća avantura',
    worldLockedAria:'{title}: zaključano. Za roditelje: otključaj sve svetove', worldLocked:'Otključaj',
    unlockTitle:'Otključaj sve svetove', gateNote:'Za roditelje: rešite zadatak da biste nastavili.', gateQuestion:'Koliko je {a} × {b}?',
    gateWrong:'To nije tačno. Novi zadatak:', gateContinue:'Dalje',
    unlockNote:'Još {worlds} svetova sa {pictures} slika. Kupi jednom i igraj zauvek, na svim uređajima sa tvojim nalogom. Bez pretplate, bez reklama.',
    buy:'Kupi za {price}', buyNoPrice:'Kupi', restore:'Vrati kupovine', unlockWorking:'Samo trenutak …',
    unlockDone:'Hvala! Svi svetovi su otključani.', unlockFailed:'Kupovina nije završena.', unlockUnavailable:'Prodavnica trenutno nije dostupna. Pokušaj ponovo kasnije.',
    restoreNone:'Nije pronađena nijedna kupovina.',
    demoTitle:'Probna verzija', demoText:'Ovde možeš da igraš svet Svemir. Svi svetovi su u aplikaciji.', storePlay:'Na Google Play', storeApple:'U App Store'
  },
  themes: {
    weltraum:{title:'Svemir', eyebrow:'Tvoja mala svemirska misija', highlight:'Pravo do zvezda.', text:'Rakete, mesečev zeka i novi prijatelji te čekaju. Izaberi sliku i složi svoju svemirsku avanturu.'},
    dinos:{title:'Dinosaurusi', eyebrow:'Tvoja mala dino-ekspedicija', highlight:'Nazad u doba dinosaurusa.', text:'Dino-bebe, dugovrati dinosaurusi i jedan dobri T-reks te čekaju. Izaberi sliku i složi put u praistoriju.'},
    hunde:{title:'Psi spasioci', eyebrow:'Tvoja mala akcija spasavanja', highlight:'Nijedan zadatak nije premali.', text:'Pet hrabrih kučića pomaže gde god može. Izaberi sliku i pridruži im se u velikoj akciji spasavanja.'},
    eis:{title:'Ledena čarolija', eyebrow:'Tvoja mala zimska avantura', highlight:'Sjaj, sneg i čarolija.', text:'Mala snežna princeza, veseli Sneško i umiljate polarne životinje te čekaju. Izaberi sliku i uđi pravo u zimsku čaroliju.'},
    piraten:{title:'Gusari', eyebrow:'Tvoja mala potraga za blagom', highlight:'Ahoj, na ostrvo s blagom!', text:'Hrabra gusarska družina, nestašni papagaj i dobra hobotnica te čekaju. Izaberi sliku i zaplovi ka velikom blagu.'},
    helden:{title:'Superheroji', eyebrow:'Tvoja mala herojska misija', highlight:'Mali junaci, velike moći.', text:'Munja, Stela, mačak Mio i robot Robo pomažu svuda po gradu. Izaberi sliku i pridruži im se u sledećem herojskom podvigu.'}
  },
  motifs: {
    '01_raketenstart':['Raketa poleće','3, 2, 1 – pravo do zvezda!','Roze raketa sa nasmejanim detetom poleće iznad šarenog predela sa oblacima i zvezdama.'],
    '02_mondhaeschen':['Mesečev zeka','Mali korak, velika avantura.','Zeka u svemirskom odelu maše na Mesecu. Pored njega je zastava sa zvezdom, a na nebu sija Zemlja.'],
    '03_ringplanet':['Oko Saturna','Mačja raketa otkriva šarene prstenove.','Mačja raketa boje mente leti ispred velike planete sa prstenovima u pastelnim bojama i jednog malog robota.'],
    '04_weltraumfreunde':['Svemirski prijatelji','Zdravo, mali vanzemaljče! Drago mi je.','Dete u svemirskom odelu i ljubazni zeleni vanzemaljac sreću se među šarenim pečurkama. Iznad njih lebdi leteći tanjir.'],
    '05_raketenrennen':['Trka raketa','Dve rakete jure kroz kišu zvezda.','Roze raketa i raketa boje mente lete sa šarenim duginim tragovima kroz nebo puno zvezda.'],
    '06_sternenpost':['Pošta za svemirsku stanicu','Pošiljka puna zvezda koje sijaju.','Udobna svemirska stanica sa mačkom pilotom i detetom dočekuje malu raketu. Pored njih su polumesec i robot poštar.'],
    '07_dino_ei':['Zdravo, mali dino!','Krc! Ko to izlazi iz jajeta?','Mali zeleni dinosaurus izleže se iz tačkastog jajeta u mekom gnezdu, okružen paprati, cvećem i dobrim vulkanom u daljini.'],
    '08_langhals_see':['Na jezeru u suton','Mama dugovrata i njena beba uživaju u zalasku sunca.','Veliki tirkizni dugovrati dinosaurus stoji sa svojom bebom u plitkom jezeru, a u pozadini sunce zalazi između palmi i planina.'],
    '09_trex_geburtstag':['Dino-rođendan','Ura! Mali T-reks danas slavi rođendan.','Veseli narandžasti T-reks sa šeširićem za žurku stoji ispred šarene torte sa svećicama, okružen balonima, zastavicama, poklonima i jednim malim dino-drugarom.'],
    '10_flugsaurier':['Let iznad mora','Juhu! Dva leteća dinosaurusa lete ispod duge.','Dva vesela leteća dinosaurusa, roze i svetloplavi, lete iznad tirkiznog mora sa malim ostrvom sa palmom, a iznad su duga, oblaci i nasmejano sunce.'],
    '11_triceratops_dschungel':['U džungli','Mali triceratops otkriva cveće i leptire.','Svetloplavi triceratops sa roze štitom na vratu i tri roga stoji nasmejan među velikim listovima džungle, šarenim cvetovima, lijanama i leptirima.'],
    '12_regenbogen_vulkan':['Vulkan duga','Puf, puf! Vulkan izbacuje srca i dugu.','Nasmejani ljubičasti vulkan izbacuje šarene oblačiće u obliku srca i dugu na nebo, a ispred njega veselo gledaju zeleni stegosaurus sa roze pločama na leđima i mali žuti dinosaurus.'],
    '13_feuerwehr_corgi':['Pomoć za mače','Korgi vatrogasac bezbedno skida mače sa drveta.','Korgi sa crvenim vatrogasnim šlemom stoji u korpi vatrogasnih merdevina i pomaže veselom mačetu da siđe sa jabuke, dok mama mačka čeka dole.'],
    '14_beagle_streife':['Pačija porodica na pešačkom prelazu','Bigl policajac zaustavlja saobraćaj da bi patke bezbedno prešle ulicu.','Bigl sa plavom policijskom kapom sedi u svom policijskom autu i podiže znak za zaustavljanje, dok mama patka sa tri pačića gega preko pešačkog prelaza do bare.'],
    '15_mops_hubschrauber':['Meda leti kući','Mops u helikopteru vraća zeki izgubljenog medu.','Mops sa pilotskim naočarima upravlja helikopterom boje mente iznad zelenih brežuljaka i na užetu spušta medu u korpici do zeke koji kliče od radosti.'],
    '16_dackel_baustelle':['Jazavičar gradi most','Svojim bagerom jazavičar pomaže da se izgradi mali most.','Jazavičar sa narandžastim šlemom sedi u narandžastom bageru i grabi pesak, dok dizalica nosi dasku za novi drveni most preko potoka, a čunjevi obezbeđuju gradilište.'],
    '17_rettungsboot':['Pojas za spasavanje za malu fokicu','Čupavi vodeni kučić baca maloj foki pojas za spasavanje.','Beli čupavi kučić sa tirkiznim prslukom za spasavanje stoji u tirkiznom čamcu za spasavanje i baca pojas maloj foki koja mu veselo maše iz talasa.'],
    '18_hunde_team':['Tim pasa spasilaca','Svih pet kučića spasilaca maše ispred svog svetionika u suton.','Pet veselih kučića spasilaca – korgi, bigl, mops, jazavičar i beli špic – stoje i mašu ispred svog prugastog svetionika sa kućicom za pse, dok sunce tone u more.'],
    '19_eispalast':['Blistava ledena palata','Mala snežna princeza čara pahuljice ispred svoje palate.','Mala princeza sa tamnim kovrdžama, dve punđe i haljinom boje jorgovana čara svetlucave pahuljice iz svojih ruku; iza nje sija ledena palata pod šarenom polarnom svetlošću, a pingvini i snežni zec je gledaju.'],
    '20_schneemann':['Pravimo Sneška','Princeza i mali beli meda prave veselog Sneška.','Mala snežna princeza i mladunče belog medveda sa šalom zajedno prave okruglog Sneška sa roze kapom sa kićankom i pletenim šalom, dok krupne pahulje padaju na zavejane jelke i udobnu drvenu kućicu.'],
    '21_schlittschuh_see':['Klizanje na jezeru','Juhu! Princeza kliže u krug sa pingvinima.','Mala snežna princeza kliže preko zaleđenog jezera i ostavlja svetlucave tragove u ledu; tri pingvina sa šalovima i štitnicima za uši jure oko nje, a mala foka gleda iz rupe u ledu.'],
    '22_schlittenfahrt':['Juhu, sankanje!','Sa snežnim zecom i polarnom lisicom princeza juri niz brdo.','Mala snežna princeza sedi sa snežnim zecom i plavosivom polarnom lisicom u crvenim sankama i kličući juri niz zavejano brdo; iza njih se diže sneg, a dole maše mali beli meda.'],
    '23_polarlicht_nacht':['Kakao pod polarnom svetlošću','Toplo ušuškani, svi gledaju polarnu svetlost i zvezde padalice.','Mala snežna princeza i mladunče belog medveda sede ušuškani pod kockastim ćebetom, piju topao kakao i gledaju šarenu polarnu svetlost i zvezde padalice, pored iglua koji sija sa lampicama, na kome sedi snežna sova.'],
    '24_eiskristall_garten':['Ples u bašti ledenih kristala','Snežna sova leti sa princezom dok ona pleše u blistavoj bašti.','Mala snežna princeza pleše podignutih ruku u svetlucavoj bašti od šarenih ledenih kristala i ledenih ruža ispod luka od leda; oko nje se kovitlaju krupne pahulje, snežna sova doleće raširenih krila, a snežni zec i pingvin plešu sa njom.'],
    '25_piratenschiff':['Dižite sidro, mali gusari!','Mali kapetan i njegova posada plove zvezdanim brodom na pučinu.','Drveni brod sa krem jedrima i zastavom sa nasmejanom zvezdom plovi preko svetlucavih talasa; napred mali kapetan sa trorogim šeširom gleda kroz dvogled, pozadi maše navigatorka, u osmatračnici sedi brodska mačka, a šareni papagaj leti uz brod dok delfini skaču pored njega.'],
    '26_schatzkarte':['Tajna mapa blaga','Gde je sakriveno blago? Papagaj pokazuje na crveno X.','Na palubi se mali kapetan i navigatorka sa kompasom saginju nad velikom mapom blaga sa ostrvom, tačkastom stazom i crvenim X, na koje šareni papagaj pokazuje krilom, dok brodska mačka sedi na buretu, a u daljini se vidi ostrvo s blagom.'],
    '27_schatzinsel':['Kopno na vidiku: ostrvo s blagom','Evo ga X! Mali kapetan već uzima lopatu.','Na plaži sa palmama mali kapetan stoji sa lopatom kod velikog X u pesku, navigatorka drži mapu blaga, brodska mačka maše, rak gleda, a papagaj sedi na palmi, dok čamac leži na obali, a zvezdani brod čeka usidren.'],
    '28_schatztruhe':['Blistavo blago','U pećini sija kovčeg pun zlata i dragog kamenja.','U ljubičastoj svetlucavoj pećini sa šarenim kristalima stoji otvoren kovčeg koji sija, pun zlatnika, dragog kamenja, bisera i jedne male krune; mali kapetan i navigatorka kliču podignutih ruku, papagaj nosi ogrlicu od bisera, a brodska mačka se raduje jednom zlatniku.'],
    '29_flaschenpost':['Poruka u boci od kita','Dobri kit donosi malim gusarima poruku u boci.','Veliki nasmejani plavi kit drži na svom vodoskoku bocu sa pismom, a mali kapetan se proteže ka njoj sa pramca zvezdanog broda, dok navigatorka maše, brodska mačka gleda, papagaj doleće, a mladunče kita pliva pored.'],
    '30_kraken_freund':['Visoko gore sa hobotnicom Kunom','Dobra džinovska hobotnica podiže male gusare u vazduh u suton.','U laguni pod roze-narandžastim nebom u suton velika nasmejana roze hobotnica nežno podiže malog kapetana i navigatorku svojim krakovima, papagaj joj sedi na glavi, a brodska mačka maše iz čamca, dok ribe skaču svuda okolo.'],
    '31_heldenteam':['Tim superheroja','Munja, Stela, mačak Mio i Robo su spremni – u suton iznad grada.','Četiri mala superheroja – dečak sa munjom na odelu, devojčica koja leti sa zvezdom, mačak sa ljubičastom maskom i mali robot – veselo mašu sa krova, a iza njih grad sija u zalasku sunca.'],
    '32_flug_ueber_stadt':['Stela donosi balone','Stela koja leti vraća odletele balone na proslavu u parku.','Devojčica superheroj u odelu sa zvezdom i ogrtačem boje mente leti sa šarenim grozdom balona iznad krovova grada, dok mali robot leti za njom, a dvoje mladunaca u parku kliče od radosti.'],
    '33_drachen_rettung':['Mačak Mio spasava zmaja','Mačak Mio se penje uz zid kuće i skida zmaja sa krova.','Narandžasti mačak sa ljubičastom maskom i odelom superheroja penje se uz visoku kuću i hvata rep šarenog zmaja od papira koji je zapeo za antenu na krovu, dok dole medvedić i dečak Munja napeto gledaju gore.'],
    '34_blitz_lieferung':['Munja donosi tortu','Brzi Munja juri sa rođendanskom tortom na proslavu u bašti.','Dečak superheroj sa munjom na tirkiznom odelu juri po svetlećem tragu preko livade i na ruci drži rođendansku tortu sa svećicama, dok kod baštenske ograde kliču zeka sa šeširićem za žurku, lisičić i mali robot sa poklonom.'],
    '35_heldenquartier':['Štab u kućici na drvetu','U udobnoj kućici na drvetu junaci se odmaraju – a Robo zaliva cveće.','Udobna kućica na drvetu sa zastavom sa zvezdom i lampicama smestila se u velikoj krošnji: Stela maše kroz okruglo prozorče, mačak Mio sedi na grani, Munja se spušta niz tobogan, a mali robot dole zaliva cveće.'],
    '36_sternennacht':['Laku noć, mali grade','U večernjem obilasku junaci pale fenjere i kače zvezde.','Iznad usnulog grada Stela nosi zvezdu koja sija na nebo, Robo svetli kao noćna lampica, mačak Mio sedi na krovu sa fenjerom, a Munja juri ulicom i pali ulične svetiljke, dok lisičić sa kapom za spavanje maše kroz prozor.'],
    '37_riesenrakete':['Ogromna raketa','Kolika raketa! A gore na prozoru sedi mali pilot.','Ogromna bela raketa sa crvenim vrhom stoji spremna za poletanje pored tornja. Na velikom okruglom prozoru sedi mali dečak smeđe kose i smeđih očiju i maše. Dole mašu i zeka i meda, koji pored rakete izgledaju sasvim maleni.'],
    '38_sternenflitzer':['Ukrcavanje!','Mali pilot se penje u zvezdani letač, a robot Pip pišti od radosti.','Dečak smeđe kose u narandžastom pilotskom odelu penje se merdevinama do otvorene kabine belog zvezdanog letača sa plavim krilima, okreće se, smeje i maše. Ispred stoji mali okrugli robot Pip sa ružičastom glavom kupolom i takođe maše. Na nebu sijaju velika planeta i mnogo zvezda.'],
    '39_wuestenplanet':['Let iznad pustinjske planete','Dva sunca, mnogo peska i pozdrav malim pustinjskim lisicama.','Zvezdani letač sa užarenim motorom leti iznad pustinjske planete sa dva sunca, peščanim dinama, kamenim lukovima i okruglim kućicama kupolama. Dečak smeđe kose maše iz kabine, robot Pip viri iz svog otvora iza njega, a dole na dini mala pustinjska lisica mu otpozdravlja.']
  }
}
};

let currentLanguage = LANGUAGES[0];
const textsOf = lang => TEXTS[lang.texts];
const inScript = text => currentLanguage.id==='sr-Cyrl'?toCyrillic(text):text;
function plural(n,forms){
  let rule='other';try{rule=new Intl.PluralRules(currentLanguage.id).select(n);}catch{}
  return forms[rule]??forms.other;
}
// Interface text in the current language and script; vars fill the {placeholders}.
function t(key,vars={}){
  const value=textsOf(currentLanguage).ui[key]??TEXTS.de.ui[key]??key;
  if(typeof value==='function')return inScript(value(vars));
  if(Array.isArray(value))return value.map(inScript);
  // Values (titles, letters, numbers) are already in the right script, only the template is converted.
  return inScript(value).replace(/\{(\w+)\}/g,(_,name)=>vars[name]??'');
}
// Texts of a world (title, eyebrow, highlight, text) or a motif (title, description, alt).
function themeText(theme,field){const own=textsOf(currentLanguage).themes?.[theme.id]?.[field];return own?inScript(own):theme[field];}
function motifText(asset,field){const own=textsOf(currentLanguage).motifs?.[asset.id];const value=own?.[['title','description','alt'].indexOf(field)];return value?inScript(value):asset[field];}
// Letters for the letter mode: {letter, word, name}; name is what the voice says for the letter.
function lettersOf(lang){
  if(lang.texts!=='sr')return TEXTS[lang.texts].letters.map(([letter,name,word])=>({letter,name,word}));
  const order=lang.id==='sr-Cyrl'?SR_CYRILLIC_ORDER:SR_LATIN_ORDER,convert=lang.id==='sr-Cyrl'?toCyrillic:text=>text;
  return order.map(letter=>({letter:convert(letter),name:convert(letter),word:convert(SR_WORDS[letter])}));
}
// Device language on the first start: Serbian Latin only when asked for explicitly, otherwise Serbian is Cyrillic (as on Serbian devices).
function detectLanguage(){
  const wanted=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'de']).map(l=>String(l).toLowerCase());
  for(const tag of wanted){
    if(/^sr/.test(tag))return /latn/.test(tag)?'sr-Latn':'sr-Cyrl';
    if(/^(hr|bs|sh|cnr)/.test(tag))return 'sr-Latn';
    const found=LANGUAGES.find(l=>tag.split('-')[0]===l.id);if(found)return found.id;
  }
  return 'de';
}
function setLanguage(id){currentLanguage=LANGUAGES.find(l=>l.id===id)||LANGUAGES[0];}
// Fills the static texts of index.html: data-i18n (text), data-i18n-html, data-i18n-aria (aria-label), data-i18n-title.
function applyStaticTexts(root=document){
  document.documentElement.lang=currentLanguage.id;document.title=t('pageTitle',{app:'Sternenpuzzle'});
  root.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
  root.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml);});
  root.querySelectorAll('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria));});
  root.querySelectorAll('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle);});
}
