interface IHasHelp {
  getHelp() : IHelp[];
}

interface IHelp {
  Key: string;
  Message: string;
  Usage: string;
}