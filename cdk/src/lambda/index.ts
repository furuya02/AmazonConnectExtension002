import AWS = require("aws-sdk");
import { SessionAttributes } from "./SessionAttribute";
import { Repository } from "./Repository";

if(process.env.IsLocal=='Yes') {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'developer'});
  AWS.config.update({region:'ap-northeast-1'});
}
 
exports.handler = async (event: any) => {
  console.log(JSON.stringify(event));

  if (event.Details) { // コンタクトフローから起動された
    return await surveyProcessing(event);
  } if(event.Records) {
    const key = event.Records[0].s3.object.key;
    if(key.indexOf('answer_') == 0) {
      // S3への「answer_」で始まるオブジェクトが、PUTされた
      return await createView();
    }
  }
}

async function surveyProcessing(event: LambdaRequest) {
  const repository = new Repository(); // S3操作
  const sa = new SessionAttributes(); // セッション情報
  const question = await repository.getQuestion(); // アンケート取得
  let disconnect  = false; // 終了フラグ
  let message = '';

  if (event.Details.Parameters.sa == '') { // 初回起動
//  if (!event.Details.Parameters.sa) { // 初回起動
      message += question.welcome_message; // 最初のメッセージ
  } else { // ２回目以降の起動
    sa.import(event.Details.Parameters.sa); // セッション情報の復元
    // 入力値の取得
    let inputData = -1;
    try{
      //Parameters.inputDataは、'Timeout'の可能性もある
      const number = Number(event.Details.Parameters.inputData);
      if (1 <= number && number <= question.surveys[sa.index].list.length) {
        inputData = number;
      }
    } catch(err){
    
    }

    if(inputData == -1){
      message += '入力された番号が無効です。もう一度、お伺いします。'
    } else {
      // 回答の保存
      sa.appendAnswer(Number(inputData));
    }
  }

  if(sa.index >= question.surveys.length) { // 終了メッセージ
    disconnect = true;
    message = question.goodby_message; 
    // 回答者の電話番号
    const phoneNumber = event.Details.ContactData.CustomerEndpoint.Address
    // アンケート結果の保存
    await repository.putAnswer(phoneNumber, sa.answer);
  } else { // アンケート
    message += question.surveys[sa.index].question; 
  }

  return {
    sa: sa.export(), // セッション情報を文字列としてコンタクトフローに保存する
    message: message, // 再生されるメッセージ
    disconnect:disconnect // アンケートを終了して切断するかどうかのフラグ
  };
}

async function createView(){

  // S3操作
  const repository = new Repository();
  // アンケート取得
  const question = await repository.getQuestion();
  // 集計用変数の初期化
  const q = Array(question.surveys.length);
  question.surveys.forEach( (survey:any,i:number) => {
      q[i] = Array.apply(null, Array(survey.list.length)).map( () => {return 0});
  })
  // 結果取得
  const answer = await repository.getAnswer();
  // 集計
  answer.forEach(a => {
      q.forEach( (n,i) => {
          n[a[i] - 1]++;
      })
  })

  let results :any[] = [];
  question.surveys.forEach((survey:any,i:number) => {
    results.push({
      question: survey.question,
      list: survey.list,
      answer: q[i]
    });
  });
  await repository.putResult(results);
  
  // // MQTTでブラウザに更新されたことを伝える
  // const endpoint = 'a10wed1626vai6-ats.iot.ap-northeast-1.amazonaws.com';
  // const topic = "surveys_refresh";
  // const mqtt = new Mqtt();
  // await mqtt.refresh(endpoint, topic);
}

type LambdaRequest = {
  Details:{
    ContactData:{
      CustomerEndpoint: {
        Address: string
      }
    }
    Parameters: {
      inputData: string,
      sa: {
        answer: string[]
      }
    }
  }
}

