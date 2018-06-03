# Lets make Vendaire great again [![Build Status](https://travis-ci.org/arijoon/vendaire-discord-bot.svg?branch=dev)](https://travis-ci.org/arijoon/vendaire-discord-bot)

## Install locally and run

```js
npm install
npm start
```

## Service dependencies

If cache is enabled, a redis instance is required, configuration are set in [docker-compose.yml](docker-compose.yml) file, or config files located inside `src` folder.

### Configuration

- Edit [src/config.secret.json.template](src/config.secret.json.template) and fill with your info
- Additionally all settings in that file can be fed in using env variables with `DiscordBot` prefix, please check [docker-compose.yml](docker-compose.yml) for reference
- View audio, content and images config files in the `src` directory. They hold paths for the files to be run
- Make sure you have populated image folder with the images you wish the command to post

## Docker run

Easiesy way to run the app is using docker. Please check the [docker-compose.yml](docker-compose.yml) for reference. You will need to modify the following line to map it to your instance:

```yml
volumes:
  - /home/pi/prod/discord/assets:/app/assets
```

`/app/assets` is where the applications will be looking for the asset files. that is set inside the [configuration](src/config.secret.json.template) as the `root` field. In order to use docker you must also build the base image.

```sh
cd base-image
docker build --tag nodejs-base .
```

then change directory to the root (where `docker-compose.yml` is located) `cd ..` and then compose the file

```sh
docker-compose build
docker-compose up -d
```

**NOTE** The dockerfiles are using base images that are compatible with RaspberryPi. You should change those in the [base image](base-image/Dockerfile) Docker file if you running it elsewhere

```docker
FROM resin/raspberry-pi-alpine:latest
```

### Commands

```md
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