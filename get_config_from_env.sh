#!/bin/bash

mkdir -p ./config
test -n "$CONFIG" && echo "$CONFIG" | base64 -d > ./config/default.json

:

