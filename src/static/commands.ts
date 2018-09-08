let commands = {

    // Glboal Prefix 
    prefix: "!!",
    
    // Show help
    help : [ "help", " --help", " help" ],
    
    // Disconnect from voice chat
    dc: 'dc',
    
    // Post random Pics
    // Dependencies: rate, addpic
    randomPics: [ 'tfw', 'god', 'bog', 'exposed', 'tsu', 'lol', 'fap', 'call', 'bullshit', 'memri', 'yousmart', 'ungabunga', 'kys', 'misc',
     'tekken', 'todd', 'anime', 'beargrylls', 'indian',
     'sfv', 'blazbluecf', 'kpop',
     'nsfw' // special case, will post it to the NSFW channel
    ],
    randomPic: 'randompic',

    // Add pic to the above folder
    addPic: 'addpic',

    // Bog related
    quickrundown: 'quickrundown',
    bog: 'bog',
    
    // Game questions
    qs: 'qs',

    // Is something randomizer
    is: [ 'is', 'are', 'does', 'will', 'would', 'has', 'have'],

    // Did thanos kill me
    didthanoskillme: 'didthanoskillme',

    // Rate something out of 10
    rate: 'rate',

    // Youtube search
    yt: 'yt',

    // Show you how to search
    search: 'search ',

    // Space out e.g HELL -> H E L L
    spaceout: 'spaceout',

    // Convert each character to big blocks
    regional: 'regional',

    // Evaluate mathematical expression
    math: 'math',
    
    // My anime list by popular demand 
    myanimelist: 'myanimelist',

    // Show online users
    whosonline: 'whosonline',

    // Ban phrase
    banphrase: 'banphrase',
    unbanphrase: 'unbanphrase',

    // Count phrase usage
    countusage: 'countusage',

    // 4Chan
    fourchan: '4chan',

    // Clean bot messages
    clean: 'clean',

    // Trump audio
    trump : "trump",

    // Movie search
    imdb: 'imdb',

    // Google API
    // Translation
    translate: 'translate',
    suggest: 'suggest',

    // Get image from instagram
    igimage: 'igimage',
    
    // Download user images
    igdownload: 'igdownload',
    
    // Search Urban Dictionary
    urban: 'urban',

    // Roll dice i.e. 1d20
    roll: 'roll',

    // Remind a user of a message in time x
    remind: 'remind',

    // Choose an option at random
    which: 'which',

    // Flip a coin
    flip: 'flip',

    // replay the last command
    replay: 'replay',

    // Games
    games: {
        rps: 'grps'
    },

    // World cup
    wcup: 'wcup',

    // Magic 8 ball
    eightball: '8ball',

    // Steam helpers
    steamurl: 'steamurl',

    // Image processing
    image: {
        gray: 'imgray',
        meme: 'immeme'
    }
};

export { commands };