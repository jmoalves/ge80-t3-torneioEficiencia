pushd ciclos
for file in *-*.json; do
	mv $file $file.bkp
	cat $file.bkp \
	| sed 's/^.*"maxPontos".*$//g' \
	| jq '.' \
	> $file;
	rm $file.bkp
done
popd
