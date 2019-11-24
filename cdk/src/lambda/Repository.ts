import AWS = require("aws-sdk");
if(process.env.IsLocal=='Yes') {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'developer'});
  AWS.config.update({region:'ap-northeast-1'});
}

export class Repository {

    private s3 = new AWS.S3();
    private bucketName = process.env.BUCKET_NAME!;
    private questionJson = "question.json"; // アンケート情報
    private resultJson = "result.json" // 集計結果
 
    async getQuestion() {
        const data = await this.get(this.questionJson);
        if(data && data.Body){
            return JSON.parse(data.Body.toString());
        }
        return {};
    }
 
    async getAnswer() {
        let keys:string[] = [];
        const data = await this.list();
        if(data && data.Contents){
            data.Contents.forEach( content => {
                const key = content.Key;
                if(key){
                    if(key.indexOf('answer_') == 0) {
                        keys.push(key);
                    }
                }
            });
            let result = [];
            for (var i=0; i < keys.length; i++) {
                const data = await this.get(keys[i]);
                if(data && data.Body){
                    var obj = JSON.parse(data.Body as string);
                    result.push(obj.answer);
                }
            }
            return result;          
        }
        return [];
    }
 
    async putAnswer(phoneNumber: string, answer: number[]){
        const dateStr = (new Date()).toString();
        const result = {
          date: dateStr,
          phoneNumber: phoneNumber,
          answer: answer
        }
        await this.put('answer_' + dateStr, JSON.stringify(result), 'public-read')
    }
 
    async putResult(results:any){
        await this.put(this.resultJson, JSON.stringify(results), 'public-read')
    }
 
    private async list() {
        var params = {
            Bucket: this.bucketName,
        };
        return await this.s3.listObjects(params).promise();
    }
 
    private async get(key: string) {
        var params = {
            Bucket: this.bucketName,
            Key: key
        };
        return await this.s3.getObject(params).promise();
    }
 
    private async put(key: string, body: any, acl: string) {
        var params = {
            Bucket: this.bucketName,
            Key: key,
            Body: body,
            ContentType: 'application/json',
            ACL: acl
        };
        await this.s3.putObject(params).promise();
    }
}