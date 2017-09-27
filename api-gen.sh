jq '{(.id): del(.id)}' ciclos/*-*.json | jq '.' > api/ciclos.json

