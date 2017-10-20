forever stopall
git pull
npm run compile
forever start build/cluster.js
tail -f $(forever list | grep -oP '\/home\/.*\.log')
