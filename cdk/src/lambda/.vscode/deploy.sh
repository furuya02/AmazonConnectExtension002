#--------------- Lambdaのみ更新 ---------------------------
#export Profile=profile
export Profile=developer
export ZipName=/tmp/upload.zip
export FunctionNam=connect-ex-questionnaire-function

rm ${ZipName} 
cd dst
zip -r ${ZipName} *
aws lambda update-function-code --function-name ${FunctionNam}  --zip-file fileb://${ZipName} --publish --p ${Profile}
