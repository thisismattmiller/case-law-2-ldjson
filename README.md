# case-law-2-ndjson
Convert a directory of LIL CASEMET files to new line delimited file

```
npm install
node parse_all.js '/Users/matt/Downloads/Illinois/'
```
It will parse all the .xml files in the directory given (recursive).

Will create an output.ndjson in the directory in http://ndjson.org/ format. The file will contain many lines that look like this: https://gist.github.com/thisismattmiller/2d8770cf7abb6b7fd3c4c6fd783aadef


