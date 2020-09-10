
            ______ ______                                  
           / ____// ____/____ ___   ____   ___   ____ _
          / /_   / /_   / __ `__ \ / __ \ / _ \ / __ `/
         / __/  / __/  / / / / / // /_/ //  __// /_/ /
        /_/    /_/    /_/ /_/ /_// .___/ \___/ \__, /
                                /_/           /____/


                build: ffmpeg-4.3.1-armhf-static.tar.xz
              version: 4.3.1

                  gcc: 6.3.0
                 yasm: N/A
                 nasm: N/A

               libaom: N/A
               libass: 0.14.0
               libgme: 0.6.2
               libsrt: 1.4.1
               libvpx: 1.8.2-225-gb79f25b54
              libvmaf: N/A
              libx264: 0.161.3018 
              libx265: N/A
              libxvid: 1.3.7 
              libwebp: 0.5.2 
              libzimg: 2.8.0
              libzvbi: N/A
             libdav1d: N/A
            libgnutls: 3.6.14
            libtheora: 1.2.0alpha1+git
            libfrei0r: 1.5.0-1
           libvidstab: 1.10
          libfreetype: 2.6.3-3.2+deb9u1
          libharfbuzz: 2.6.6
          libopenjpeg: N/A 

              libalsa: 1.2.2
              libsoxr: 0.1.3
              libopus: 1.3.1
             libspeex: 1.2
            libvorbis: 1.3.7
           libmp3lame: 3.100 
        librubberband: 1.8.2
       libvo-amrwbenc: 0.1.3-1
    libopencore-amrnb: 0.1.3-2.1+b2
    libopencore-amrwb: 0.1.3-2.1+b2


     Notes:  A limitation of statically linking glibc is the loss of DNS resolution. Installing
             nscd through your package manager will fix this.

             The vmaf filter needs external files to work- see model/000-README.TXT


      This static build is licensed under the GNU General Public License version 3.

      
      Patreon: https://www.patreon.com/johnvansickle
      Paypal:  https://www.paypal.me/johnvansickle 
      Bitcoin: 3ErDdF5JeG9RMx2DXwXEeunrsc5dVHjmeq 

      email: john.vansickle@gmail.com
      irc:   relaxed @ irc://chat.freenode.net #ffmpeg
      url:   https://johnvansickle.com/ffmpeg/
