docker image build --tag discord-bot:$(git describe) .  
docker container rm -f discord-bot
docker run -d -v /home/pi/prod/discord/assets:/app/assets --restart=always --name discord-bot discord-bot:$(git describe)
