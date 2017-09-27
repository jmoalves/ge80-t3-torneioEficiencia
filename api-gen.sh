cat ciclos/*-*.json \
| jq -s 'reduce .[] as $item ({}; . + $item)' \
| jq '.' \
> api/ciclos.json
