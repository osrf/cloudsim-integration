#!/bin/bash

# To be executed after the machine is created. It reads from cloudsim-options.json.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
codedir="$DIR/.."
# Helper to parse options from cloudsim-options.json
get_option(){
  echo `node -pe "var f = \"$1\"; var query = \"$2\"; var j=require(f); j[query] "`
}


optionsfile=$codedir/cloudsim-options.json

role=`get_option $optionsfile role`
callback_url=`get_option $optionsfile callback_url`
callback_hz_secs=`get_option $optionsfile callback_hz_secs`
callback_token=`get_option $optionsfile callback_token`

# the public ip of this machine
ip=`curl checkip.amazonaws.com`

log=$codedir/cloudsim.log
echo `date` >> $log
echo "role: $role"  >> $log
echo "callback_url: $callback_url" >> $log
echo "callback_hz_secs: $callback_hz_secs" >> $log
echo "callback_token: $callback_token" >> $log

{
    # Stop the container after 10 minutes
    sleep 600
    echo "$callback_hz_secs sec TIMEOUT TIMEOUT TIMEOUT (shutdown in 10 secs)" >> $log
    sleep 10
    # this command terminates the AWS instance
    shutdown now

} &
timer_pid=$!

{
  while true
  do
    echo "=================" >> $log
    echo `date` >> $log
    echo "Callback!" >> $log
    curl $callback_url?ip=$ip&token=$callback_token
    sleep $callback_hz_secs
  done
} &
callback_pid=$!



