# Lets make Vendaire great again

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
bog - posts a random picture from bog folder in images
tfw - posts a random picture from tfw folder in images
tsu - posts a random picture from tsu folder in images
trump - plays a random trump audio file in the current chat channel you are
quickrundown - posts quickrundown.txt content prefixed with quickrundown.png in the bog folder
help - shows help
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

 public detach(): void {
     this._subscription.dispose(); // detaches the subscription
 }

```



The above class implements `ICommand` and is binded in the `container.ts` . Simply bind any new `ICommand` instance and attach to the stream you wish to intercept. It'll work like magic. 



## Entry point

The entry is in `bootstrap.ts`, so read from there if you want a complete grasp