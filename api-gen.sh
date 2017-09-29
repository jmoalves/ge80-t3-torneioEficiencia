#!/bin/bash
maxCiclos=$1
if [ "a$maxCiclos" == "a" ]; then
	maxCiclos=12
fi

cat $(ls -1 ciclos/*-*.json | sort | tail -n $maxCiclos) \
| jq -s 'reduce .[] as $item ({}; . + $item)' \
| jq '.' \
> api/ciclos.json

echo
echo Agregados $(jq 'length'  api/ciclos.json) ciclos
jq 'keys' api/ciclos.json

echo
