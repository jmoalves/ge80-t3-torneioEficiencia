pushd ciclos
for file in *-*.json; do
	mv $file $file.bkp
	cat $file.bkp \
	| sed 's/"patrulha"\: \[/"patrulha": /g' \
	| sed 's/"idPatrulha"\: \(.*\),/\1: {/g' \
	| sed 's/"porDia"\: \[/"dia": /g' \
	| sed 's/"id"\: \(.*\),/\1: {/g' \
	| sed 's/^[[:blank:]]\+{//g' \
	| sed 's/]/}/g' \
	| sed 's/^}$/} }/g' \
	| jq '.' \
	> $file;
	rm $file.bkp
done
popd
