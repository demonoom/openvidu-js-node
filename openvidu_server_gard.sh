#! /bin/bash
while true; do
    {
        node openvidu_server.js kms.maaee.com:4443 MY_SECRET
        echo "openvidu_server_node stopped unexpected, restarting"
    }
    sleep 1
done