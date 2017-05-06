# Lets make Vendaire great again [![Build Status](https://travis-ci.org/arijoon/vendaire-discord-bot.svg?branch=dev)](https://travis-ci.org/arijoon/vendaire-discord-bot)

## Install and run

```js
npm install
npm start
```

### Configuration

- Edit `src/config.secret.json.template` and fill with your info
- View audio, content and images config files in the `src` directory. They hold paths for the files to be run
- Make sure you have populated image folder with the images you wish the command to post

### Commands

```
Usage: !![commands] [optional arguments]

    Commands:

        help| --help                     Show this prompt
        trump                            Play trump audio in your current voice channel
        qs                               Post a random question
        yt {text}                        Post first result of youtube search for text
        tfw                              Post a feel pic
        bog                              Post a bog pic
        tsu                              Post a tsuuuu pic
        god                              Post a god pic
        call                             Post a call pic
        exposed                          Post an exposed pic
        lol                              Post a lol pic 
        bullshit                         Post a lol pic 
        memri                            Post a lol pic 
        yousmart                         Post a lol pic 
        randomPic                        Post a lol pic 
        quickrundown                     Post quickrundown pic with description
        regional {text}                  Post your text in regional format
        spaceout {text}                  Space out each character and add column
        rate {name|link}                 Rates the subject out of 10
        math {expression}                Evaluates the mathematical expression
        is{somthing} {text}              Randomize whether something is text
        are{somethings} {text}           Randomize whether something are text
        does{somethings} {text}          Randomize whether something does text
        will{somthing} {text}            Randomize whether something is text
        would{somethings} {text}         Randomize whether something are text
        has{somethings} {text}           Randomize whether something does text
        have{somethings} {text}          Randomize whether something does text
        whosonline                       Show who is online
        clean {num}                      clean the last {num} bot messages
        imdb {moviename} [options]       Search imdb for moviename
        translate {text} [options]       translate the text
```



### Architecture

`ICommand` is every command that can attach the main stream and perform an action on a specific command. Example: 

```ts
 _command: string = commands.dc; // dc
 _subscription: IDisposable;

 constructor(
     @inject(TYPES.IClient) private _client: IClient,
 ) { }

 public attach(): void {
     this._client
         .getCommandStream(this._command) // attaches to !!dc messages
         .subscribe(msg => { // runs this function on !!dc messages
             let cons = this._client.getClient().voiceConnections; // gets all voice connections
             cons.forEach((v, k) => v.disconnect()); // loops through and executes dc
         });
 }
```



The above class implements `ICommand` and is binded in the `container.ts` . Simply bind any new `ICommand` instance and attach to the stream you wish to intercept. It'll work like magic. 

## Entry point

The entry is in `bootstrap.ts`, so read from there if you want a complete grasp
The prod entry point is in `cluster.ts`, the clustering system is used to take advantage of multithreading and process all commands truely as parallel as each other without interference