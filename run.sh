SCRIPTNAME="dev"
#!/bin/bash
SCRIPTNAME=$1
if [ $# -eq 0 ] 
then
    echo "Defaulting run script to dev"
    SCRIPTNAME="dev"
fi

sudo env PATH=$PATH:/home/pi/n/bin npm run $SCRIPTNAME