#! /bin/bash
while true; do
    {
         read a < <(ps -def | grep '/usr/bin/kurento-media-server' | grep -v grep | awk '{print $1}')


         time=$(date "+%Y-%m-%d %H:%M:%S")

         if [ $a == "kurento" ];then
            #echo "kms server is running ...$time"
            time=$(date "+%Y-%m-%d %H:%M:%S")
         else
            echo "kms server is killed , restarting...$time"
            service kurento-media-server restart
         fi

    }
    sleep 3
done